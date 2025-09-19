package com.skillcircle.service;

import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class ModerationService {

    private final OkHttpClient client = new OkHttpClient();

    @Value("${perspective.api.key}")
    private String apiKey;

    private static final double TOXICITY_THRESHOLD = 0.5; // Set a threshold (0.0 to 1.0)

    public boolean isContentInappropriate(String text) throws IOException {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }

        String url = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=" + apiKey;

        // Create the JSON request body
        JSONObject requestBody = new JSONObject();
        requestBody.put("comment", new JSONObject().put("text", text));
        requestBody.put("languages", new JSONArray().put("en"));
        requestBody.put("requestedAttributes", new JSONObject().put("TOXICITY", new JSONObject()));

        RequestBody body = RequestBody.create(
                requestBody.toString(),
                MediaType.get("application/json; charset=utf-8")
        );

        Request request = new Request.Builder().url(url).post(body).build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                // If API fails, better to approve than block legitimate content
                System.err.println("Perspective API call failed: " + response.body().string());
                return false;
            }

            JSONObject jsonResponse = new JSONObject(response.body().string());
            double toxicityScore = jsonResponse.getJSONObject("attributeScores")
                    .getJSONObject("TOXICITY")
                    .getJSONObject("summaryScore")
                    .getDouble("value");

            System.out.println("Toxicity Score: " + toxicityScore);
            return toxicityScore > TOXICITY_THRESHOLD;
        }
    }
}
package com.skillcircle.controller;

import com.skillcircle.dto.StatsResponseDTO;
import com.skillcircle.service.StatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping
    public ResponseEntity<StatsResponseDTO> getStats() {
        StatsResponseDTO stats = statsService.getAppStats();
        return ResponseEntity.ok(stats);
    }
}
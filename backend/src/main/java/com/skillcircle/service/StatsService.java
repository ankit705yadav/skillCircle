package com.skillcircle.service;

import com.skillcircle.Entity.ConnectionStatus;
import com.skillcircle.dto.StatsResponseDTO;
import com.skillcircle.repository.ConnectionRepository;
import com.skillcircle.repository.SkillPostRepository;
import com.skillcircle.repository.UserAccountRepository;
import org.springframework.stereotype.Service;

@Service
public class StatsService {

    private final UserAccountRepository userAccountRepository;
    private final ConnectionRepository connectionRepository;
    private final SkillPostRepository skillPostRepository;

    public StatsService(UserAccountRepository userAccountRepository, ConnectionRepository connectionRepository, SkillPostRepository skillPostRepository) {
        this.userAccountRepository = userAccountRepository;
        this.connectionRepository = connectionRepository;
        this.skillPostRepository = skillPostRepository;
    }

    public StatsResponseDTO getAppStats() {
        long totalUsers = userAccountRepository.count();
        long totalConnections = connectionRepository.count();
        long activeConnections = connectionRepository.countByStatus(ConnectionStatus.ACCEPTED);
        long totalPosts = skillPostRepository.count();
        long activePosts = skillPostRepository.countByArchived(false);

        return new StatsResponseDTO(totalUsers, totalConnections, activeConnections, totalPosts, activePosts);
    }
}
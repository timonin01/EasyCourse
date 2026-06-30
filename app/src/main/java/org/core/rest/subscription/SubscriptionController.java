package org.core.rest.subscription;

import lombok.RequiredArgsConstructor;
import org.core.context.UserContextBean;
import org.core.dto.subscription.SubscriptionStatusDTO;
import org.core.service.subscription.SubscriptionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserContextBean userContextBean;

    @GetMapping("/status")
    public SubscriptionStatusDTO getStatus() {
        return subscriptionService.getStatus(userContextBean.getUserId());
    }
}

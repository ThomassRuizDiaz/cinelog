package com.cinelog.common.status;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/status")
public class StatusController {

    @GetMapping
    StatusResponse getStatus() {
        return new StatusResponse("ok");
    }

    record StatusResponse(String status) {
    }
}

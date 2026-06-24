package com.cinelog.actor;

import com.cinelog.actor.dto.ActorDetailResponse;
import com.cinelog.actor.dto.ActorListItemResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/actors")
public class ActorController {

    private final ActorService actorService;

    public ActorController(ActorService actorService) {
        this.actorService = actorService;
    }

    @GetMapping
    List<ActorListItemResponse> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return actorService.list(query, page, size);
    }

    @GetMapping("/{id}")
    ActorDetailResponse get(@PathVariable Long id) {
        return actorService.get(id);
    }
}

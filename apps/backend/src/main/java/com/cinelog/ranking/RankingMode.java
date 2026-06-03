package com.cinelog.ranking;

public enum RankingMode {
    PERSONAL("Personal"),
    TECHNICAL("Technical"),
    OBJECTIVE("Objective"),
    STORY("Story"),
    DIRECTION("Direction"),
    PERFORMANCES("Performances"),
    PACING("Pacing"),
    VISUALS("Visuals"),
    MUSIC("Music"),
    THEMES("Themes"),
    ORIGINALITY("Originality"),
    IMPACT("Impact");

    private final String scoreLabel;

    RankingMode(String scoreLabel) {
        this.scoreLabel = scoreLabel;
    }

    public String getScoreLabel() {
        return scoreLabel;
    }
}

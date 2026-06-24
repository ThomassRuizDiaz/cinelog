package com.cinelog.rating;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.math.BigDecimal;

public class CategoryScoreValidator implements ConstraintValidator<CategoryScore, BigDecimal> {

    private static final BigDecimal QUARTER_POINT = new BigDecimal("0.25");

    @Override
    public boolean isValid(BigDecimal value, ConstraintValidatorContext context) {
        return value == null || value.remainder(QUARTER_POINT).compareTo(BigDecimal.ZERO) == 0;
    }
}

package com.cinelog.rating;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.math.BigDecimal;

public class CategoryScoreValidator implements ConstraintValidator<CategoryScore, BigDecimal> {

    private static final BigDecimal HALF_POINT = new BigDecimal("0.5");

    @Override
    public boolean isValid(BigDecimal value, ConstraintValidatorContext context) {
        return value == null || value.remainder(HALF_POINT).compareTo(BigDecimal.ZERO) == 0;
    }
}

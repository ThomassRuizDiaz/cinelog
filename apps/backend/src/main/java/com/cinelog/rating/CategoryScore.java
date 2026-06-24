package com.cinelog.rating;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@DecimalMin("0.00")
@DecimalMax("10.00")
@Digits(integer = 2, fraction = 2)
@Constraint(validatedBy = CategoryScoreValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface CategoryScore {

    String message() default "Score must be between 0 and 10 in 0.25 increments";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

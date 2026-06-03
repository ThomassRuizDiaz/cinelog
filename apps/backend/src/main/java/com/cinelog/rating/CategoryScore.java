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

@DecimalMin("0.0")
@DecimalMax("5.0")
@Digits(integer = 1, fraction = 1)
@Constraint(validatedBy = CategoryScoreValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface CategoryScore {

    String message() default "Score must be between 0 and 5 in 0.5 increments";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

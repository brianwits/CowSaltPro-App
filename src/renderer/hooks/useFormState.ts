import { useState, useCallback } from 'react';

interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

interface FieldConfig<T> {
  initialValue: T;
  rules?: ValidationRule<T>[];
}

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
}

interface UseFormStateResult<T> {
  formState: FormState<T>;
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string | null) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  setValues: (values: Partial<T>) => void;
}

export function useFormState<T extends Record<string, any>>(
  fields: Record<keyof T, FieldConfig<T[keyof T]>>
): UseFormStateResult<T> {
  const initialValues = Object.entries(fields).reduce(
    (acc, [key, config]) => ({
      ...acc,
      [key]: config.initialValue,
    }),
    {} as T
  );

  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isValid: true,
    isDirty: false,
  });

  const validateField = useCallback(
    (field: keyof T): boolean => {
      const fieldConfig = fields[field];
      const value = formState.values[field];
      
      if (!fieldConfig.rules) return true;

      for (const rule of fieldConfig.rules) {
        if (!rule.validate(value)) {
          setFormState(prev => ({
            ...prev,
            errors: { ...prev.errors, [field]: rule.message },
            isValid: false,
          }));
          return false;
        }
      }

      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: undefined },
      }));
      return true;
    },
    [fields, formState.values]
  );

  const validateForm = useCallback((): boolean => {
    const fieldResults = Object.keys(fields).map(field => 
      validateField(field as keyof T)
    );
    const isValid = fieldResults.every(Boolean);
    
    setFormState(prev => ({
      ...prev,
      isValid,
    }));

    return isValid;
  }, [fields, validateField]);

  const handleChange = useCallback(
    (field: keyof T) => (value: any) => {
      setFormState(prev => ({
        ...prev,
        values: { ...prev.values, [field]: value },
        isDirty: true,
      }));
      validateField(field);
    },
    [validateField]
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setFormState(prev => ({
        ...prev,
        touched: { ...prev.touched, [field]: true },
      }));
      validateField(field);
    },
    [validateField]
  );

  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setFormState(prev => ({
        ...prev,
        values: { ...prev.values, [field]: value },
        isDirty: true,
      }));
      validateField(field);
    },
    [validateField]
  );

  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error || undefined },
      isValid: !error,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
    });
  }, [initialValues]);

  const setValues = useCallback(
    (values: Partial<T>) => {
      setFormState(prev => ({
        ...prev,
        values: { ...prev.values, ...values },
        isDirty: true,
      }));
      validateForm();
    },
    [validateForm]
  );

  return {
    formState,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    setValues,
  };
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule<any> => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return true;
      return !!value;
    },
    message,
  }),
  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),
  phone: (message = 'Invalid phone number'): ValidationRule<string> => ({
    validate: (value: string) => {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      return phoneRegex.test(value);
    },
    message,
  }),
  minLength: (length: number, message = `Minimum length is ${length}`): ValidationRule<string> => ({
    validate: (value: string) => value.length >= length,
    message,
  }),
  maxLength: (length: number, message = `Maximum length is ${length}`): ValidationRule<string> => ({
    validate: (value: string) => value.length <= length,
    message,
  }),
  min: (min: number, message = `Minimum value is ${min}`): ValidationRule<number> => ({
    validate: (value: number) => value >= min,
    message,
  }),
  max: (max: number, message = `Maximum value is ${max}`): ValidationRule<number> => ({
    validate: (value: number) => value <= max,
    message,
  }),
};

export default useFormState; 
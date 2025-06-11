import React from 'react';

interface FormErrorMessageProps {
  message?: string;
}

const FormErrorMessage: React.FC<FormErrorMessageProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <p className="mt-1 text-sm text-danger-600">
      {message}
    </p>
  );
};

export default FormErrorMessage;

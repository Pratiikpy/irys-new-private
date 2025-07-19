import React, { forwardRef, useState } from 'react';

const Textarea = forwardRef(({ 
  label, 
  error, 
  className = '',
  disabled = false,
  placeholder,
  maxLength,
  showCharCount = false,
  rows = 4,
  ...props 
}, ref) => {
  const [charCount, setCharCount] = useState(props.value?.length || 0);

  const handleChange = (e) => {
    setCharCount(e.target.value.length);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const textareaClasses = `
    textarea-field
    ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-cyan-400'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <textarea
          ref={ref}
          className={textareaClasses}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        
        {showCharCount && maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {charCount}/{maxLength}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
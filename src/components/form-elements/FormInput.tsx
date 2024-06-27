import ValidationError from "../dialogs/ValidationError";

interface FormInputProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  placeholder?: string;
  errorMessage?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

}

const FormInput = ({ label, type = 'text', name, value, placeholder = '', errorMessage = '', onChange }: FormInputProps) => {
  return (
    <label className='block'>
      {label}
      <input 
        name={name} 
        className={ 
          'block mt-1 w-full rounded-md' 
          + (errorMessage ? ' border-red-500 dark:border-red-700' : '')
        }
        type={type} 
        value={value} 
        placeholder={placeholder} 
        onChange={onChange} />
        {errorMessage && <ValidationError message={errorMessage} /> }
    </label>
  );
}

export default FormInput;
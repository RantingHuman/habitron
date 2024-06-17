interface FormInputProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

}

const FormInput = ({ label, type = "text", name, value, onChange }: FormInputProps) => {
return (
  <label className='block'>
    {label}
    <input name={name} className='block mt-1 w-full rounded-md dark:bg-gray-700' type={type} value={value} onChange={onChange} />
  </label>
);
}

export default FormInput;
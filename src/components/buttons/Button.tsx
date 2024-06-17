interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  name: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  appearance?: 'primary' | 'secondary' | 'danger';
  children?: React.ReactNode;
}

const Button = ({ type, name, className = '', appearance = 'secondary', onClick, children }: ButtonProps) => {
  const appearanceClasses = {
    primary: 'dark:bg-blue-700 bg-blue-500',
    danger: 'dark:bg-red-700 bg-red-500',
    secondary: 'dark:bg-gray-700 bg-gray-500',
  }[appearance];
  
  return (
    <button
      name={name} 
      onClick={onClick} 
      type={type} 
      className={`${className} 
                  ${appearanceClasses} 
                  text-white px-4 py-2 rounded-md`
                }
    >
      {children}
    </button>
  );
}

export default Button;
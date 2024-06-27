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
    primary: 'dark:bg-blue-700 bg-orange-400',
    danger: 'dark:bg-red-700 bg-red-400',
    secondary: 'dark:bg-gray-700 bg-orange-100',
  }[appearance];
  
  return (
    <button
      name={name} 
      onClick={onClick} 
      type={type} 
      className={`${className} 
                  ${appearanceClasses} 
                  px-4 py-2 rounded-md shadow-custom active:shadow-inner active:opacity-85 hover:opacity-90 dark:shadow-custom-dark
                  `
                }
    >
      {children}
    </button>
  );
}

export default Button;
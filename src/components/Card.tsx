import React from "react";

interface CardProps {
  header?: string;
  children: React.ReactNode;
}

const Card = ({header, children}: CardProps) => {
  return (
    

    <div className='flex flex-col gap-4 dark:bg-slate-700 bg-amber-200 rounded-md border mb-4 border-black'>
      { 
        header &&
        <div className='bg-amber-300 dark:bg-inherit p-4 rounded-t border-b border-black'>{header}</div>
      }
      <div className='p-4'>
        {children}
      </div>
    </div>
  )
}

export default Card;
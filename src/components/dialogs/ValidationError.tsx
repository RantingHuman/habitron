const ValidationError = ({ message }: { message: string }) => {
    return (
        <p className='mt-1 text-red-500 dark:text-red-700 text-sm'>{message}</p>
    );
}

export default ValidationError;
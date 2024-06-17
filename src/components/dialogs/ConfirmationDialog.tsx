import Button from "../buttons/Button";
interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;

}

const ConfirmationDialog = ({isOpen, title, message, onConfirm, onCancel} : ConfirmationDialogProps) => {
    return (
        <div className={`fixed inset-0 bg-black bg-opacity-80 z-50 ${isOpen ? '' : 'hidden'}`}>
            <div className='p-4 rounded-md w-96 mx-auto mt-20 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 border-2'>
                <h2 className='text-lg font-semibold'>{title}</h2>
                <p>{message}</p>
                <div className='flex justify-end gap-6 mt-4'>
                  <Button name='Cancel' appearance='secondary' onClick={onCancel}>Cancel</Button>
                  <Button name='Confirm' appearance='danger' onClick={onConfirm}>Confirm</Button>
                </div>
            </div>
        </div>
    );

}

export default ConfirmationDialog;
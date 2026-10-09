import { Toaster } from "sonner";

export function ToastViewport() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "ui-toast",
          title: "ui-toast__title",
          description: "ui-toast__description",
        },
      }}
    />
  );
}

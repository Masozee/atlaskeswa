import { Alert } from 'react-native';

type ErrorUtilsLike = {
  setGlobalHandler: (handler: (error: any, isFatal?: boolean) => void) => void;
  getGlobalHandler: () => (error: any, isFatal?: boolean) => void;
};

let installed = false;

const formatError = (err: any): string => {
  if (!err) return 'Unknown error';
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

const showAlertSafely = (title: string, message: string) => {
  try {
    Alert.alert(title, message, [{ text: 'OK' }]);
  } catch (alertErr) {
    console.error('[GlobalError] failed to show Alert:', alertErr);
  }
};

export const setupGlobalErrorHandler = (): void => {
  if (installed) return;
  installed = true;

  const ErrorUtils: ErrorUtilsLike | undefined = (global as any).ErrorUtils;
  if (ErrorUtils) {
    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      console.error('[GlobalError]', { isFatal, error });
      showAlertSafely(
        isFatal ? 'Kesalahan Fatal' : 'Kesalahan Aplikasi',
        formatError(error),
      );
      previousHandler?.(error, isFatal);
    });
  } else {
    console.warn('[GlobalError] ErrorUtils not available — skipping');
  }

  try {
    const rejectionTracking = require('promise/setimmediate/rejection-tracking');
    rejectionTracking.enable({
      allRejections: true,
      onUnhandled: (id: number, rejection: any) => {
        console.error('[UnhandledRejection]', id, rejection);
        showAlertSafely('Promise Tidak Tertangani', formatError(rejection));
      },
      onHandled: (id: number) => {
        console.log('[UnhandledRejection] handled later:', id);
      },
    });
  } catch (err) {
    console.warn('[GlobalError] promise rejection tracking unavailable:', err);
  }
};

interface FeedbackMessagesProps {
  connectionError: string;
  error: string;
  notice: string;
  onReconnect: () => void;
  onCloseError: () => void;
  onCloseNotice: () => void;
}

export function FeedbackMessages({
  connectionError,
  error,
  notice,
  onReconnect,
  onCloseError,
  onCloseNotice,
}: FeedbackMessagesProps) {
  return (
    <>
      {connectionError && (
        <div className="toast error" role="alert">
          {connectionError}
          <button onClick={onReconnect}>Reconectar</button>
        </div>
      )}

      {error && (
        <div className="toast error" role="alert">
          {error}
          <button onClick={onCloseError} aria-label="Fechar erro">
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className="toast" role="status">
          <span>✓</span>
          {notice}
          <button onClick={onCloseNotice} aria-label="Fechar aviso">
            ×
          </button>
        </div>
      )}
    </>
  );
}

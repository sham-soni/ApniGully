function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>{statusCode || 'Error'}</h1>
      <p>{statusCode ? `A ${statusCode} error occurred on the server` : 'An error occurred on the client'}</p>
      <a href="/" style={{ marginTop: 16, color: '#2AB7A4' }}>Go home</a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;

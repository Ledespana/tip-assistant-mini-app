const PoweredByBanner = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <a
        href="https://upassistants.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          margin: '10px',
          display: 'block',
          backgroundColor: '#DB7C3D',
          fontSize: '12px',
          width: '200px',
          color: '#fff',
          padding: '2px 5px',
          textAlign: 'center',
          borderRadius: '5px',
          textDecoration: 'none',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        Powered by UpAssistants
      </a>
    </div>
  );
};

export default PoweredByBanner;

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
          margin: '5px',
          display: 'block',
          backgroundColor: '#f8fafb',
          fontSize: '12px',
          width: '180px',
          color: 'rgb(54 80 99 / 0.6)',
          padding: '2px 2px',
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

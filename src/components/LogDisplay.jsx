import React from 'react';

const LogDisplay = ({ log }) => {
  if (!log || log.length === 0) return null;

  return (
    <>
      <hr />
      <h4 className="mt-4">Log de Processamento:</h4>
      <div className="log-container">
        {log.map((line, index) => (
          <div key={index} className={getLogLineClass(line)}>
            {line}
          </div>
        ))}
      </div>
    </>
  );
};

const getLogLineClass = (line) => {
  if (line.includes('✓') || line.includes('Playlist criada')) {
    return 'text-success';
  } else if (line.includes('✗') || line.includes('Erro')) {
    return 'text-danger';
  } else if (line.includes('⚠')) {
    return 'text-warning';
  }
  return '';
};

export default LogDisplay;

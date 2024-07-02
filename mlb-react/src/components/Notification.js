import React from 'react';
import './Notification.css';

const Notification = ({ message, onReload, onDismiss }) => {
  return (
    <div className="notification">
      <div className="notification-content">
        <p>{message}</p>
        <div className="notification-actions">
          <button className="btn btn-primary" onClick={onReload}>Reload</button>
          <button className="btn btn-secondary" onClick={onDismiss}>Dismiss</button>
        </div>
      </div>
    </div>
  );
};

export default Notification;

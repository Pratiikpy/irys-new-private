import React from 'react';
import { 
  BellIcon, 
  ExclamationTriangleIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon,
  FireIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatDate, getCrisisResources } from '../../utils/helpers';

const NotificationPanel = ({ isOpen, onClose, notifications = [] }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'confession':
        return <ChatBubbleLeftIcon className="w-5 h-5 text-cyan-400" />;
      case 'reply':
        return <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />;
      case 'vote':
        return <HeartIcon className="w-5 h-5 text-red-400" />;
      case 'crisis':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'trending':
        return <FireIcon className="w-5 h-5 text-orange-400" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationContent = (notification) => {
    switch (notification.type) {
      case 'confession':
        return {
          title: 'New Confession',
          content: `${notification.data.author} shared a new confession`,
          time: formatDate(notification.timestamp)
        };
      case 'reply':
        return {
          title: 'New Reply',
          content: `${notification.data.author} replied to a confession`,
          time: formatDate(notification.timestamp)
        };
      case 'vote':
        return {
          title: 'Vote Update',
          content: `Someone ${notification.data.vote_type}d a confession`,
          time: formatDate(notification.timestamp)
        };
      case 'crisis':
        return {
          title: 'Crisis Support Resources',
          content: 'We detected you might need support. Here are some resources.',
          time: formatDate(notification.timestamp)
        };
      default:
        return {
          title: 'Notification',
          content: 'You have a new notification',
          time: formatDate(notification.timestamp)
        };
    }
  };

  const CrisisNotification = ({ notification }) => {
    const resources = getCrisisResources();
    
    return (
      <div className="crisis-support rounded-lg p-4 my-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-white flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-2">Crisis Support Resources</h4>
            <p className="text-sm text-green-100 mb-4">
              If you're having thoughts of self-harm or suicide, please reach out for help. You're not alone.
            </p>
            
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-white mb-1">24/7 Hotlines</h5>
                <div className="space-y-1">
                  {resources.hotlines.map((hotline, index) => (
                    <div key={index} className="text-sm text-green-100">
                      <span className="font-medium">{hotline.name}:</span> {hotline.number}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-white mb-1">Online Resources</h5>
                <div className="space-y-1">
                  {resources.websites.map((website, index) => (
                    <a
                      key={index}
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-200 hover:text-white underline block"
                    >
                      {website.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      size="lg"
      className="h-[70vh] flex flex-col"
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-2">
              You'll see live updates here as they happen
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.slice().reverse().map((notification) => {
              const { title, content, time } = getNotificationContent(notification);
              
              if (notification.type === 'crisis') {
                return (
                  <CrisisNotification key={notification.id} notification={notification} />
                );
              }
              
              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{title}</h4>
                      <span className="text-xs text-gray-400">{time}</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{content}</p>
                    
                    {notification.type === 'confession' && notification.data.content && (
                      <div className="mt-2 p-2 bg-gray-700 rounded text-sm text-gray-300">
                        "{notification.data.content.substring(0, 100)}..."
                      </div>
                    )}
                    
                    {notification.type === 'reply' && notification.data.content && (
                      <div className="mt-2 p-2 bg-gray-700 rounded text-sm text-gray-300">
                        "{notification.data.content.substring(0, 100)}..."
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-700">
        <Button
          variant="secondary"
          onClick={onClose}
          fullWidth
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default NotificationPanel;
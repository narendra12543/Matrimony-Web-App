class NotificationService {
  constructor() {
    this.permission = Notification.permission;
    this.isSupported = 'Notification' in window;
  }

  async requestPermission() {
    if (!this.isSupported) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }

    return false;
  }

  showNotification({ title, body, icon, tag, data, onClick }) {
    console.log('🔔 Attempting to show notification:', { title, body });
    console.log('🔔 Permission status:', this.permission);
    console.log('🔔 Is supported:', this.isSupported);
    
    if (!this.isSupported || this.permission !== 'granted') {
      console.log('❌ Cannot show notification - not supported or no permission');
      return null;
    }

    console.log('✅ Showing notification');
    
    const notification = new Notification(title, {
      body,
      icon: icon || undefined, // Remove favicon reference
      tag: tag || 'chat-notification',
      requireInteraction: false,
      data: data || {}
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();
      if (onClick) {
        onClick(data);
      }
    };

    return notification;
  }

  showMessageNotification({ senderName, message, avatar, chatId, onClick }) {
    console.log('📨 Showing message notification from:', senderName);
    
    const title = `New message from ${senderName}`;
    let body = message.content;

    // Handle different message types
    switch (message.messageType) {
      case 'image':
        body = '📷 Sent an image';
        break;
      case 'video':
        body = '🎥 Sent a video';
        break;
      case 'document':
        body = '📄 Sent a document';
        break;
      case 'file':
        body = '📎 Sent a file';
        break;
      default:
        // Limit text length
        if (body && body.length > 50) {
          body = body.substring(0, 50) + '...';
        }
    }

    return this.showNotification({
      title,
      body,
      icon: avatar || undefined, // Remove favicon reference
      tag: `chat-${chatId}`,
      data: { chatId, senderId: message.sender._id },
      onClick
    });
  }

  clearNotifications(tag) {
    // This is a limitation of the Notification API
    // We can't programmatically clear notifications
    console.log(`Would clear notifications with tag: ${tag}`);
  }
}

export default new NotificationService();
 

import "./ChatBox.css";

const ChatBox = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <span>Chat</span>
        <button onClick={onClose}>×</button>
      </div>

      <div className="chatbox-messages">
        <div className="message received">Hi, I think this item is mine.</div>
        <div className="message sent">Sure, where did you lose it?</div>
      </div>

      <div className="chatbox-input">
        <input type="text" placeholder="Type a message..." />
        <button>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;

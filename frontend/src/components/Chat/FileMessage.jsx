import { motion } from 'framer-motion';
import { Download, Eye, FileText, Image, Video, File, ExternalLink } from 'lucide-react';

const FileMessage = ({ message, isOwnMessage }) => {
  const { file, messageType, content } = message;

  const getFileIcon = () => {
    switch (messageType) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'document':
        return FileText;
      default:
        return File;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (file?.url) {
      window.open(file.url, '_blank');
    }
  };

  const handleView = () => {
    if (file?.url) {
      window.open(file.url, '_blank');
    }
  };

  // Ensure we have file data
  if (!file || !file.url) {
    return (
      <div className={`max-w-xs p-3 rounded-lg border border-red-200 bg-red-50`}>
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">File unavailable</p>
            <p className="text-xs text-red-600">{content || 'Unknown file'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (messageType === 'image') {
    return (
      <div className="max-w-[280px] sm:max-w-sm">
        <div className="relative group rounded-lg overflow-hidden bg-gray-100">
          <img
            src={file.url}
            alt={content}
            className="w-full h-auto max-h-48 sm:max-h-80 object-contain"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback for broken images */}
          <div className="hidden w-full h-32 sm:h-40 bg-gray-200 items-center justify-center">
            <div className="text-center">
              <Image className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-gray-500">Image unavailable</p>
            </div>
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-1 sm:space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleView}
                className="p-1.5 sm:p-2 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 transition-all"
                title="View full size"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDownload}
                className="p-1.5 sm:p-2 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 transition-all"
                title="Download"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
              </motion.button>
            </div>
          </div>
        </div>
        <div className="mt-1 sm:mt-2 px-1 sm:px-2">
          <p className="text-xs text-gray-500 truncate">{content}</p>
          {file.size && (
            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
          )}
        </div>
      </div>
    );
  }

  if (messageType === 'video') {
    return (
      <div className="max-w-[280px] sm:max-w-sm">
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
          <video
            src={file.url}
            controls
            className="w-full h-auto max-h-48 sm:max-h-80 object-contain"
            preload="metadata"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          >
            Your browser does not support the video tag.
          </video>
          {/* Fallback for broken videos */}
          <div className="hidden w-full h-32 sm:h-40 bg-gray-200 items-center justify-center">
            <div className="text-center">
              <Video className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-gray-500">Video unavailable</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleView}
                className="mt-1 sm:mt-2 px-2 sm:px-3 py-1 bg-rose-500 text-white rounded text-xs hover:bg-rose-600 transition-colors"
              >
                Open in new tab
              </motion.button>
            </div>
          </div>
        </div>
        <div className="mt-1 sm:mt-2 px-1 sm:px-2">
          <p className="text-xs text-gray-500 truncate">{content}</p>
          <div className="flex items-center justify-between">
            {file.size && (
              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              Download
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // For documents and other files
  const FileIcon = getFileIcon();
  
  return (
    <div className={`max-w-[280px] sm:max-w-xs p-3 sm:p-4 rounded-lg border shadow-sm ${
      isOwnMessage 
        ? 'bg-white border-rose-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
        <div className={`p-1.5 sm:p-2 rounded-lg ${
          messageType === 'document' 
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-600'
        }`}>
          <FileIcon className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={content}>
            {content}
          </p>
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-500">
            {file.format && (
              <span className="uppercase font-medium">{file.format}</span>
            )}
            {file.size && (
              <>
                <span>•</span>
                <span>{formatFileSize(file.size)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleView}
          className="flex-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors flex items-center justify-center space-x-1"
        >
          <Eye className="w-3 h-3" />
          <span>View</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center space-x-1"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </motion.button>
      </div>
    </div>
  );
};

export default FileMessage;

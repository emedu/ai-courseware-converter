
import React, { useRef, useState } from 'react';

interface ImagePlaceholderProps {
  id: string;
  imageData: string | undefined; // Base64 string
  onImageUpload: (id: string, base64: string) => void;
  onImageDelete: (id: string) => void;
  width?: string;
  onSizeChange?: (width: string) => void;
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({ 
    id, 
    imageData, 
    onImageUpload, 
    onImageDelete,
    width = '100%',
    onSizeChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(id, reader.result as string);
        setShowModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteClick = () => {
    onImageDelete(id);
  };
  
  const handleUrlImport = async () => {
    if (!imageUrl) {
        setError('請輸入圖片網址');
        return;
    }
    setError('');
    try {
        // This is a simplified fetch. A real-world scenario might need a backend proxy
        // to bypass CORS issues for many websites.
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error('無法獲取圖片，請檢查網址或圖片權限。');
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            onImageUpload(id, reader.result as string);
            setShowModal(false);
            setImageUrl('');
        };
        reader.readAsDataURL(blob);
    } catch (err) {
        console.error("Error fetching image from URL:", err);
        setError('無法載入此圖片。可能是因為該網站的隱私設定不允許直接連結，或網址不正確。請嘗試將圖片下載後手動上傳。');
    }
  };

  const Modal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">插入圖片</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">從網址匯入</label>
                <div className="flex">
                    <input 
                        type="text" 
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.png"
                        className="flex-grow p-2 border border-gray-300 rounded-l-md"
                    />
                    <button onClick={handleUrlImport} className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700">匯入</button>
                </div>
            </div>

            <div className="text-center my-4 text-gray-500">或</div>

            <div>
                <button onClick={handleTriggerFileInput} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-md hover:bg-gray-300">
                    <i className="fas fa-upload mr-2"></i> 從電腦上傳
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="my-6 flex flex-col items-center" style={{ pageBreakInside: 'avoid' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif, image/webp"
      />
      {showModal && <Modal />}
      {imageData ? (
        <div className="relative group w-full flex flex-col items-center">
          <img src={imageData} alt={`Uploaded content for ${id}`} className="rounded-md shadow-md" style={{ width: '100%' }} />
          
          {/* Actions Overlay */}
          <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 p-2 rounded-lg z-10">
            <button
              onClick={() => setShowModal(true)}
              className="text-white hover:text-blue-300 transition-colors"
              title="更換圖片"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-white hover:text-red-400 transition-colors"
              title="刪除圖片"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>

          {/* Size Control Bar */}
          {onSizeChange && (
             <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 p-1 rounded-full border shadow-sm">
                 <button onClick={() => onSizeChange('25%')} className={`px-2 py-0.5 text-xs rounded-full ${width === '25%' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}>S</button>
                 <button onClick={() => onSizeChange('50%')} className={`px-2 py-0.5 text-xs rounded-full ${width === '50%' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}>M</button>
                 <button onClick={() => onSizeChange('75%')} className={`px-2 py-0.5 text-xs rounded-full ${width === '75%' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}>L</button>
                 <button onClick={() => onSizeChange('100%')} className={`px-2 py-0.5 text-xs rounded-full ${width === '100%' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}>Full</button>
             </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => setShowModal(true)}
          className="image-placeholder-empty w-full h-48 border-2 border-dashed border-gray-400 rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 hover:border-blue-500 cursor-pointer transition-colors"
        >
          <i className="fas fa-camera text-4xl mb-2"></i>
          <p className="font-semibold">建議插入圖片</p>
          <p>點擊此處上傳或從網址匯入</p>
        </div>
      )}
    </div>
  );
};

export default ImagePlaceholder;

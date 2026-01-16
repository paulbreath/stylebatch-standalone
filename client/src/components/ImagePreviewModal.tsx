import { X, Download } from "lucide-react";
import { useEffect } from "react";

interface ImagePreviewModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
}

export function ImagePreviewModal({ imageUrl, isOpen, onClose, fileName }: ImagePreviewModalProps) {
  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // 防止背景滚动
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="关闭预览"
      >
        <X className="h-6 w-6" />
      </button>

      {/* 下载按钮 */}
      <a
        href={imageUrl}
        download={fileName || "converted-image.png"}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 z-10 flex h-10 items-center gap-2 rounded-full bg-purple-600 px-4 text-white hover:bg-purple-700 transition-colors"
      >
        <Download className="h-5 w-5" />
        <span className="text-sm font-medium">下载</span>
      </a>

      {/* 图片容器 */}
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Preview"
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* 提示文本 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        按 ESC 或点击背景关闭
      </div>
    </div>
  );
}

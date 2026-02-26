-- AlterTable
ALTER TABLE "Section" ADD COLUMN "inputLabel" TEXT DEFAULT '输入需要评测的文本',
ADD COLUMN "inputPlaceholder" TEXT DEFAULT '在此粘贴您需要评测的文本内容...',
ADD COLUMN "submitButtonText" TEXT DEFAULT '开始评测',
ADD COLUMN "resultLabel" TEXT DEFAULT '评测结果',
ADD COLUMN "emptyResultText" TEXT DEFAULT '评测结果将在这里显示',
ADD COLUMN "loadingText" TEXT DEFAULT 'AI 正在分析中...';

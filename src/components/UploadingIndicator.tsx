@@ .. @@
 export function UploadingIndicator({
   fileName,
   progress,
+  error,
+  onRetry,
   size = 'md',
   onCancel,
   className = '',
 }: {
   fileName: string;
   progress: number; // 0-100
+  error?: string;
+  onRetry?: () => void;
   size?: LoadingSize;
   onCancel?: () => void;
   className?: string;
 }) {
   const sizeClasses = {
     xs: 'p-2 text-xs',
     sm: 'p-3 text-sm',
     md: 'p-4 text-base',
     lg: 'p-5 text-lg',
     xl: 'p-6 text-xl'
   };
 
   return (
     progress > 0 && (
-    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${sizeClasses[size]} ${className}`}>
-      <div className="flex items-center mb-2">
-        <Upload className="text-[#FF8A00] mr-2 h-5 w-5" />
-        <span className="text-white font-medium">Uploading {fileName}</span>
-      </div>
-      <div className="flex justify-between items-center">
-        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
-          <div
-            className="bg-[#FF8A00] h-2 rounded-full transition-all duration-300 ease-out"
-            style={{ width: `${progress}%` }}
-          ></div>
-        </div>
-        {progress < 100 && onCancel && (
-          <button 
-            onClick={onCancel} 
-            className="ml-2 text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-700"
-            aria-label="Cancel upload"
-          >
-            <X className="h-4 w-4" />
-          </button>
-        )}
-      </div>
-      
-      <p className="text-gray-400 text-xs mt-1 text-right">{Math.round(progress)}%</p>
-    </div>
+    <div className={`bg-gray-800 border ${error ? 'border-red-500/30' : 'border-gray-700'} rounded-lg ${sizeClasses[size]} ${className}`}>
+      {error ? (
+        <div className="space-y-3">
+          <div className="flex items-center">
+            <AlertCircle className="text-red-400 mr-2 h-5 w-5" />
+            <span className="text-white font-medium">Upload Error</span>
+          </div>
+          <p className="text-gray-300 text-sm">{error}</p>
+          <div className="flex justify-end space-x-2">
+            {onRetry && (
+              <Button
+                variant="outline"
+                size="sm"
+                leftIcon={RefreshCw}
+                onClick={onRetry}
+              >
+                Retry
+              </Button>
+            )}
+            {onCancel && (
+              <Button
+                variant="ghost"
+                size="sm"
+                onClick={onCancel}
+              >
+                Cancel
+              </Button>
+            )}
+          </div>
+        </div>
+      ) : (
+        <>
+          <div className="flex items-center mb-2">
+            <Upload className="text-[#FF8A00] mr-2 h-5 w-5" />
+            <span className="text-white font-medium">Uploading {fileName}</span>
+          </div>
+          <div className="flex justify-between items-center">
+            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1 overflow-hidden">
+              <div
+                className="bg-[#FF8A00] h-2.5 rounded-full transition-all duration-300 ease-out relative"
+                style={{ width: `${progress}%` }}
+              >
+                <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
+              </div>
+            </div>
+            {progress < 100 && onCancel && (
+              <button 
+                onClick={onCancel} 
+                className="ml-2 text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-700"
+                aria-label="Cancel upload"
+              >
+                <X className="h-4 w-4" />
+              </button>
+            )}
+          </div>
+          
+          <p className="text-gray-400 text-xs mt-1 text-right">{Math.round(progress)}%</p>
+        </>
+      )}
+    </div>
     )
   );
 }
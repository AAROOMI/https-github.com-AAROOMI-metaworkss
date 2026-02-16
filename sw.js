
const CACHE_NAME = 'metaworks-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.svg',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/data/controls.ts',
  '/data/templates.ts',
  '/data/trainingData.ts',
  '/data/iso27001AssessmentData.ts',
  '/data/nistCsfAssessmentData.ts',
  '/data/isa62443AssessmentData.ts',
  '/data/assessmentData.ts',
  '/data/pdplAssessmentData.ts',
  '/data/samaCsfAssessmentData.ts',
  '/data/cmaAssessmentData.ts',
  '/data/riskAssessmentData.ts',
  '/data/virtualAgents.ts',
  '/components/AuditLogPage.tsx',
  '/components/CompanyProfilePage.tsx',
  '/components/CompanySetupPage.tsx',
  '/components/ContentView.tsx',
  '/components/ContentViewSkeleton.tsx',
  '/components/Dashboard.tsx',
  '/components/DocumentsPage.tsx',
  '/components/Icons.tsx',
  '/components/LoginPage.tsx',
  '/components/Sidebar.tsx',
  '/components/SubdomainAccordion.tsx',
  '/components/UserManagementPage.tsx',
  '/components/AssessmentSheet.tsx',
  '/components/HelpSupportPage.tsx',
  '/components/TrainingPage.tsx',
  '/components/CourseDetailPage.tsx',
  '/components/LessonPlayer.tsx',
  '/components/LiveAssistantWidget.tsx',
  '/components/NooraAssistant.tsx',
  '/components/ComplianceAgentPage.tsx',
  '/components/DidEmbed.tsx', 
  '/components/GenericAssessmentPage.tsx',
  '/components/DomainComplianceBarChart.tsx',
  '/components/PDPLComplianceBarChart.tsx',
  '/components/SamaCsfComplianceBarChart.tsx',
  '/components/CMADomainComplianceBarChart.tsx',
  '/components/VaptOrchestratorPage.tsx',
  '/components/VirtualDepartmentPage.tsx',
  'https://cdn.tailwindcss.com',
  'https://rsms.me/inter/inter.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js',
  'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://unpkg.com/html-to-docx-ts@1.8.0/dist/browser/html-to-docx.js',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1/client',
  'https://aistudiocdn.com/@google/genai@^1.16.0'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching assets');
        const requests = URLS_TO_CACHE.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
      .catch(err => {
        console.error('Cache addAll failed:', err);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
      return;
  }
  
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            if (response.type === 'basic' || response.type === 'cors') {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
            }

            return response;
          }
        );
      })
  );
});

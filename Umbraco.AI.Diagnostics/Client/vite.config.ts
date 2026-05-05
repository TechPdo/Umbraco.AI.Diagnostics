import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: {
                'tree': 'src/tree.ts',
                'workspace': 'src/workspace.ts',
                'workspace-view': 'src/workspace-view.ts',
                'trend-analysis-view': 'src/trend-analysis-view.ts',
                'visualizations-view': 'src/visualizations-view.ts',
                'repository': 'src/repository.ts',
                'analysis-markdown': 'src/analysis-markdown.ts',
                'log-viewer-search-enhancer': 'src/log-viewer-search-enhancer.ts',
                'log-analysis-modal.element': 'src/log-analysis-modal.element.ts',
                'log-analysis-modal-token': 'src/log-analysis-modal-token.ts'
            },
            formats: ['es']
        },
        outDir: '../wwwroot/App_Plugins/UmbracoAIDiagnostics',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            external: [/^@umbraco/]
        }
    }
});

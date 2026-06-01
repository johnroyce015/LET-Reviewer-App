window.OfflineSync = {

    syncCategories: async function() {

        if (!navigator.onLine) {
            return JSON.parse(
                localStorage.getItem('let_categories')
            ) || [];
        }

        try {

            const { data, error } =
                await window.supabaseClient
                .from('categories')
                .select('*');

            if (error) throw error;

            localStorage.setItem(
                'let_categories',
                JSON.stringify(data)
            );

            return data;

        } catch {

            return JSON.parse(
                localStorage.getItem('let_categories')
            ) || [];
        }
    },

    syncQuestions: async function(categoryName) {

        const storageKey =
            `let_questions_${categoryName.replace(/\s+/g, '_')}`;

        if (!navigator.onLine) {

            return JSON.parse(
                localStorage.getItem(storageKey)
            ) || [];
        }

        try {

            const { data, error } =
                await window.supabaseClient
                .from('questions')
                .select('*')
                .eq('category', categoryName);

            if (error) throw error;

            localStorage.setItem(
                storageKey,
                JSON.stringify(data)
            );

            return data;

        } catch {

            return JSON.parse(
                localStorage.getItem(storageKey)
            ) || [];
        }
    },

    syncExamResults: async function() {

        if (!navigator.onLine) return;

        const pending =
            JSON.parse(
                localStorage.getItem(
                    'pending_exam_results'
                )
            ) || [];

        if (!pending.length) return;

        const {
            data: { session }
        } =
        await window.supabaseClient.auth.getSession();

        if (!session) return;

        for (const result of pending) {

            const { error } =
                await window.supabaseClient
                .from('exam_results')
                .insert({
                    user_id: session.user.id,
                    category: result.category,
                    score: result.score,
                    total: result.total,
                    submitted_at:
                        result.submitted_at
                });

            if (!error) {

                const remaining =
                    JSON.parse(
                        localStorage.getItem(
                            'pending_exam_results'
                        )
                    ) || [];

                localStorage.setItem(
                    'pending_exam_results',
                    JSON.stringify(
                        remaining.filter(
                            x =>
                            x.submitted_at !==
                            result.submitted_at
                        )
                    )
                );
            }
        }
    }
};

window.addEventListener(
    'online',
    () => window.OfflineSync.syncExamResults()
);


export default function HelpSupport() {
    const sections = [
        {
            title: 'Common Questions',
            items: [
                {
                    question: 'How do I create a task?',
                    answer: 'Click the "+ Add New Task" button on the Dashboard or Tasks page.',
                },
                {
                    question: 'How do I manage projects?',
                    answer: 'You can create and manage projects from the sidebar. Use projects to group related tasks together.',
                },
                {
                    question: 'What is Home/Work mode?',
                    answer: 'You can separate your personal and professional tasks by switching between Home and Work modes in the top filter.',
                },
            ],
        },
        {
            title: 'Contact Us',
            items: [
                {
                    label: 'Email Support',
                    value: 'support@taskplanner.com',
                    link: 'mailto:support@taskplanner.com',
                },
                {
                    label: 'Visit Website',
                    value: 'www.taskplanner.com',
                    link: 'https://www.taskplanner.com',
                },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Help & Support</h1>

                <div className="space-y-8">
                    {sections.map((section, idx) => (
                        <div key={idx} className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-medium text-gray-700">{section.title}</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                {section.items.map((item, iIdx) => (
                                    <div key={iIdx}>
                                        {'question' in item ? (
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.question}</h3>
                                                <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">{item.label}</p>
                                                    <p className="text-base font-semibold text-blue-600">{item.value}</p>
                                                </div>
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-sm font-medium transition-colors"
                                                >
                                                    Visit
                                                </a>
                                            </div>
                                        )}
                                        {iIdx < section.items.length - 1 && (
                                            <div className="mt-6 pt-6 border-t border-gray-100" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>TaskPlanner v1.0.0</p>
                    <p className="mt-1">© 2026 TaskPlanner Team</p>
                </div>
            </div>
        </div>
    );
}

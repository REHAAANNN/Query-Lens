import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

interface QuerySuggestion {
    query: string;
    description: string;
    category: 'completion' | 'optimization' | 'template';
}

export class AIQueryHelper {
    private static model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Get smart completions based on partial query
    static async getCompletions(partialQuery: string): Promise<QuerySuggestion[]> {
        if (!partialQuery.trim() || partialQuery.length < 5) {
            return this.getBasicTemplates();
        }

        try {
            const prompt = `You are a PostgreSQL expert. Given this incomplete SQL query, suggest 3 realistic completions:

Query so far: "${partialQuery}"

Available table: students (columns: id, student_id, first_name, last_name, email, age, major, gpa, enrollment_date, graduation_year, is_active, created_at)

Return ONLY a JSON array with this structure (no markdown, no other text):
[
  {
    "query": "complete SELECT statement here",
    "description": "what this query does",
    "category": "completion"
  }
]

Make suggestions realistic, useful, and complete the user's intent. Include WHERE, LIMIT, ORDER BY where appropriate.`;

            const result = await this.model.generateContent(prompt);
            const text = result.response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return suggestions.slice(0, 3);
            }
        } catch (error) {
            console.warn('AI suggestion failed:', error);
        }

        return this.getBasicTemplates();
    }

    // Get query optimization suggestions
    static async getOptimizationSuggestions(query: string): Promise<string[]> {
        if (!query.trim()) return [];

        try {
            const prompt = `Analyze this PostgreSQL query and give 3 quick optimization tips:

Query: ${query}

Table: students (5000 rows, indexed on: major, gpa, enrollment_date, email, is_active)

Return ONLY a JSON array of strings (no markdown):
["tip 1", "tip 2", "tip 3"]

Focus on: missing indexes, missing WHERE, missing LIMIT, inefficient operators, better alternatives.`;

            const result = await this.model.generateContent(prompt);
            const text = result.response.text();

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.warn('Optimization suggestion failed:', error);
        }

        return [];
    }

    // Built-in templates when AI is unavailable
    private static getBasicTemplates(): QuerySuggestion[] {
        return [
            {
                query: 'SELECT * FROM students WHERE major = \'Computer Science\' ORDER BY gpa DESC LIMIT 10',
                description: 'Top 10 Computer Science students by GPA',
                category: 'template'
            },
            {
                query: 'SELECT major, COUNT(*) as count, AVG(gpa)::DECIMAL(3,2) as avg_gpa FROM students GROUP BY major ORDER BY avg_gpa DESC',
                description: 'Average GPA by major (sorted)',
                category: 'template'
            },
            {
                query: 'SELECT * FROM students WHERE gpa > 3.5 AND is_active = true LIMIT 100',
                description: 'Active high-performing students',
                category: 'template'
            },
            {
                query: 'SELECT first_name, last_name, email, major, gpa FROM students WHERE enrollment_date > \'2023-01-01\' ORDER BY enrollment_date DESC LIMIT 50',
                description: 'Recently enrolled students',
                category: 'template'
            }
        ];
    }

    // Keyword-based smart completions (instant, no AI)
    static getInstantSuggestions(partial: string): QuerySuggestion[] {
        const lower = partial.toLowerCase().trim();

        if (lower === 'sel' || lower === 'sele' || lower === 'selec') {
            return [
                {
                    query: 'SELECT * FROM students LIMIT 10',
                    description: 'Select all columns with limit',
                    category: 'completion'
                },
                {
                    query: 'SELECT student_id, first_name, last_name, major, gpa FROM students WHERE ',
                    description: 'Select specific columns with filter',
                    category: 'completion'
                }
            ];
        }

        if (lower.includes('select') && lower.includes('from students') && !lower.includes('where')) {
            return [
                {
                    query: partial + ' WHERE gpa > 3.0 LIMIT 100',
                    description: 'Add WHERE condition',
                    category: 'completion'
                },
                {
                    query: partial + ' ORDER BY gpa DESC LIMIT 50',
                    description: 'Add ORDER BY',
                    category: 'completion'
                }
            ];
        }

        if (lower.includes('where') && !lower.includes('limit')) {
            return [
                {
                    query: partial + ' LIMIT 100',
                    description: 'Add LIMIT to prevent full scan',
                    category: 'completion'
                },
                {
                    query: partial + ' ORDER BY gpa DESC LIMIT 50',
                    description: 'Add ORDER BY and LIMIT',
                    category: 'completion'
                }
            ];
        }

        return [];
    }
}

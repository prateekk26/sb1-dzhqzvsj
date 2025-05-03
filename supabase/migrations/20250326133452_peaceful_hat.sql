/*
  # Create competencies table and import data
  
  1. New Tables
    - `competencies`
      - `id` (uuid, primary key)
      - `code` (text, unique code for the competency)
      - `name` (text, name of the competency)
      - `assessment_type` (text, type of assessment)
      - `category` (text, category of the competency)
      - `level_1_description` to `level_5_description` (text, descriptions for each level)
      - `definition` (text, short definition of the competency)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on the table
    - Add policies for reading competencies data
    
  3. Data
    - Import initial competencies dataset
*/

-- Create the competencies table if it doesn't exist
CREATE TABLE IF NOT EXISTS competencies (
  id uuid PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  assessment_type text NOT NULL,
  category text NOT NULL,
  level_1_description text NOT NULL,
  level_2_description text NOT NULL,
  level_3_description text NOT NULL,
  level_4_description text NOT NULL,
  level_5_description text NOT NULL,
  definition text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for reading competencies
CREATE POLICY "Allow authenticated users to read competencies"
  ON competencies
  FOR SELECT
  TO authenticated
  USING (true);
  
-- Create policy for reading competencies by anonymous users
CREATE POLICY "Allow anonymous users to read competencies"
  ON competencies
  FOR SELECT
  TO anon
  USING (true);

-- Insert competencies data
INSERT INTO competencies (id, code, name, assessment_type, category, level_1_description, level_2_description, level_3_description, level_4_description, level_5_description, created_at, updated_at, definition)
VALUES
('1a25ea3c-f742-4d59-9e79-01b41a7b644d', 'CST', 'Critical & Structured Thinking', 'Explicit', 'Intellectual', 'Answer is confusing, illogical, lacks clarity or structure, misses key points completely.', 'Shows basic logic; analysis is superficial, partially answers question, lacks depth or structure.', 'Clear, logical thinking; answers core parts correctly with structured reasoning, though some complexity missed.', 'Strong logical reasoning; consistently addresses complexities clearly and precisely, good analytical structure.', 'Exceptional clarity and analytical depth; consistently synthesizes complex information, demonstrates insightful and original reasoning.', '2025-03-01 22:55:31.957422+00', '2025-03-01 22:55:31.957422+00', 'Clearly analyzing and solving problems logically.'),

('5661ba44-8f27-4f11-835b-43230fc843da', 'AC', 'Adaptive Communication', 'Overarching', 'Interpersonal', 'Responses unclear, inappropriate tone/length, poorly matched to audience/context, lacks coherence.', 'Basic clarity achieved, but struggles adapting communication to context; misjudges audience needs frequently.', 'Clearly articulated; adapts message moderately well, though occasionally misjudges detail or tone required.', 'Consistently clear, concise, and appropriately adapts content, tone, and detail level to match audience effectively.', 'Exceptionally clear, precise, engaging; effortlessly adapts message perfectly to all audiences (exec, VP, peer), delivering exactly appropriate detail.', '2025-03-01 22:55:31.957422+01', '2025-03-01 22:55:31.957422+01', 'Adjusting communication effectively to different situations.'),

('666897ac-3a1b-41c4-92a9-de1f09df337d', 'POI', 'Proactive Ownership & Initiative', 'Explicit', 'Operational', 'Passive approach; shows minimal initiative, requires explicit guidance, rarely expands beyond assigned tasks.', 'Occasionally proactive; limited scope, minor improvements or suggestions beyond assigned work.', 'Generally proactive; regularly suggests improvements, demonstrates initiative beyond direct instructions in familiar areas.', 'Strong proactive approach; consistently seeks opportunities, takes ownership beyond assigned scope, independently solves problems.', 'Outstanding ownership; proactively identifies impactful improvements, independently drives innovation, consistently delivers superior-quality work without oversight.', '2025-03-01 22:55:31.957422+02', '2025-03-01 22:55:31.957422+02', 'Taking responsibility and initiating improvements without being prompted.'),

('9347989a-b897-4828-ac24-c3c30e5693b4', 'CI', 'Collaborative Influence', 'Explicit', 'Interpersonal', 'Poor collaborator; ineffective communication, negatively impacts team cohesion, unable to align with group decisions.', 'Adequate team player; contributes occasionally, but struggles to positively influence team or align effectively when there''s disagreement.', 'Good collaborator; effectively communicates with team members, generally aligns positively with collective decisions, supports team environment.', 'Consistently strong influencer; effectively guides team discussion, respectfully challenges and aligns with team decisions, enhances team dynamics positively.', 'Exceptional collaborator; masterfully influences without authority, consistently aligns and motivates teams toward shared goals, handles conflicts constructively and positively.', '2025-03-01 22:55:31.957422+03', '2025-03-01 22:55:31.957422+03', 'Positively influencing and working effectively within teams.'),

('a3222670-932d-4576-8ac3-53d80727b382', 'GMC', 'Growth Mindset & Curiosity', 'Explicit', 'Intellectual', 'Avoids new skills; demonstrates resistance to feedback, uncomfortable with ambiguity or new challenges.', 'Occasionally receptive to learning; slow to adapt new skills, hesitant with feedback or ambiguous situations.', 'Actively engages in learning; receptive to feedback, shows willingness to develop new skills, occasionally challenged by ambiguity.', 'Strongly committed to growth; actively seeks feedback and learning opportunities, handles ambiguity effectively, rapidly adapts new skills.', 'Passionate learner; proactively seeks continuous improvement, actively embraces ambiguity, rapidly learns from feedback, consistently broadens skillsets significantly.', '2025-03-01 22:55:31.957422+04', '2025-03-01 22:55:31.957422+04', 'Continually seeking to learn and adapt to new information or skills.'),

('a805d947-974d-461e-9e0f-a29540c13873', 'LSV', 'Leadership & Strategic Vision (senior roles only)', 'Conditional', 'Leadership', 'Lacks clear vision or strategic direction; unable to inspire or effectively manage others, poor accountability.', 'Provides occasional strategic direction, inconsistent management effectiveness, limited empowerment or inspiration of team members.', 'Demonstrates solid leadership; sets clear direction, effectively manages and occasionally empowers/inspires teams.', 'Strong strategic leader; consistently communicates clear vision, effectively empowers teams, inspires alignment and commitment to goals.', 'Inspirational leader; visionary who motivates others, consistently empowers and develops future leaders, sets clear and compelling strategic direction, expertly manages change.', '2025-03-01 22:55:31.957422+05', '2025-03-01 22:55:31.957422+05', 'Setting clear direction and motivating others effectively (senior roles only).'),

('cab718c3-c24d-4c85-9ca9-5db77b68e0b7', 'EISA', 'Emotional Intelligence & Self-Awareness', 'Overarching', 'Interpersonal', 'Demonstrates limited empathy or emotional awareness; poor at managing own emotions or interpersonal relationships.', 'Occasionally empathetic; inconsistent self-awareness, limited ability in managing interpersonal conflicts or personal emotions.', 'Generally empathetic; manages emotions and interpersonal relationships effectively, resolves conflicts adequately.', 'Consistently empathetic and self-aware; effectively manages own emotions, skillfully navigates interpersonal relationships, resolves conflicts constructively.', 'Exceptionally empathetic and self-aware; deeply understands others'' perspectives, expertly manages relationships and conflicts, consistently builds strong interpersonal bonds, highly respected by peers.', '2025-03-01 22:55:31.957422+06', '2025-03-01 22:55:31.957422+06', 'Understanding and managing your own and others'' emotions effectively.'),

('cbcd3510-70c9-491e-8f41-d839cbf5e61d', 'EE', 'Execution Excellence', 'Explicit', 'Operational', 'Disorganized; frequently misses deadlines, struggles significantly under complexity or pressure, poor planning and prioritization.', 'Inconsistent execution; meets deadlines occasionally, requires regular oversight and reminders, struggles with prioritization.', 'Generally reliable; adequately plans, prioritizes, and meets deadlines, though struggles occasionally with complex scenarios.', 'Strong execution; consistently plans effectively, manages complexity independently, reliably meets deadlines and commitments.', 'Exceptional execution skills; consistently delivers ahead of deadlines, expertly prioritizes tasks under complexity or ambiguity, always meets or exceeds expectations.', '2025-03-01 22:55:31.957422+07', '2025-03-01 22:55:31.957422+07', 'Consistently completing tasks efficiently, on-time, and at high quality.'),

('b65ccc1e-900d-43fb-ad8b-19e5b94ff156', 'VWC', 'Verbal & Written Comprehension', 'Overarching', 'Universal', 'Fails to comprehend questions; responses frequently off-topic, misunderstood or irrelevant, poor clarity.', 'Basic comprehension; frequently misses nuances or complex elements of questions, responses partially clear but imprecise.', 'Solid comprehension; accurately interprets questions, generally clear and structured responses with minor gaps.', 'Strong comprehension; consistently accurate interpretation of complex questions, clearly and precisely structured responses.', 'Exceptional comprehension; quickly grasps nuanced questions, delivers insightful, precise, and clearly structured responses consistently and effortlessly.', '2025-03-01 22:55:31.957422+08', '2025-03-01 22:55:31.957422+08', 'Clearly understanding and effectively responding to communication.'),

('6b57281b-92a6-4c6a-9ec6-cf5960a447e8', 'RA', 'Resilience & Adaptability', 'Explicit', 'Operational', 'Struggles significantly under pressure; rigid, resistant to change, slow recovery from setbacks or difficulties.', 'Occasionally adapts but visible discomfort under stress or change; slow to recover from setbacks, hesitates in ambiguity.', 'Generally resilient; effectively adapts to changes and recovers adequately from setbacks, though can be challenged by rapid shifts.', 'Consistently resilient; quickly adapts to change, effectively handles pressure, rapidly recovers from setbacks, navigates ambiguity confidently.', 'Exceptionally resilient; thrives in uncertainty, proactively anticipates and manages change, quickly transforms setbacks into growth opportunities, consistently demonstrates adaptability under all conditions.', '2025-03-01 22:55:31.957422+09', '2025-03-01 22:55:31.957422+09', 'Quickly and effectively adapting to change or overcoming setbacks.'),

('239866f5-f505-4da4-9d6a-8152fbf454b9', 'MRA', 'Motivation & Role Alignment', 'Explicit', 'Cultural & Motivational', 'Little to no genuine interest or understanding of the role or company; motivations unclear or irrelevant.', 'Demonstrates surface-level interest; generic reasons given, minimal alignment to the role or company specifics.', 'Clearly interested; shows good understanding of role and company, identifies a few relevant motivations but lacks depth or personal alignment.', 'Strongly interested; articulates well-defined reasons for choosing the role/company, closely aligns personal strengths and aspirations with the position''s requirements.', 'Exceptional motivation and alignment; clearly passionate about the role and company mission, demonstrates deep personal alignment and insight into how their background specifically meets company needs and long-term vision', '2025-03-01 22:55:31.957422+10', '2025-03-01 22:55:31.957422+10', 'Genuine enthusiasm and alignment with the role and organization''s values.'),

('d4e65b12-345a-42db-b9b7-ec12c1e45a68', 'INT', 'Introductory Communication', 'Explicit', 'Interpersonal', 'Answer lacks structure, clarity, relevance, or does not effectively highlight professional strengths or experiences.', 'Basic clarity; provides a generic introduction but misses key relevant details or structure in conveying professional journey.', 'Clear and structured; communicates professional journey and strengths adequately but lacks depth or detail that aligns explicitly to the role.', 'Strongly structured and engaging introduction; effectively highlights relevant experiences and key strengths aligned to role or background context provided (JD/resume).', 'Exceptionally compelling; concise, clear, engaging, and specifically tailored introduction highlighting highly relevant strengths and professional journey strongly aligned with provided context (JD/resume), creating an immediate positive impression.', '2025-03-01 22:55:31.957422+11', '2025-03-01 22:55:31.957422+11', 'Clearly and effectively introducing professional background and key strengths.'),

('f17d9d22-b837-4fd7-abe1-97df98e01b7e', 'CON', 'Concluding Questions', 'Explicit', 'Intellectual', 'Does not ask any questions or asks irrelevant questions indicating minimal interest or understanding.', 'Asks superficial or generic questions; minimal effort to align or demonstrate genuine interest in the role or company.', 'Asks relevant questions demonstrating moderate understanding and interest, though lacking in strategic depth or personalized insight.', 'Asks thoughtful, strategic questions clearly demonstrating preparation, genuine interest, and deeper understanding of the role and company.', 'Exceptional, insightful questions demonstrating deep strategic thinking, proactive interest, and detailed understanding, clearly reflecting thoughtful alignment to role/company and genuine enthusiasm.', '2025-03-01 22:55:31.957422+12', '2025-03-01 22:55:31.957422+12', 'Asking insightful questions demonstrating genuine interest and thoughtful preparation.');

-- Add a update_updated_at trigger for the competencies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_competencies_updated_at'
  ) THEN
    CREATE TRIGGER update_competencies_updated_at
    BEFORE UPDATE ON competencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
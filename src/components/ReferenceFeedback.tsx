@@ .. @@
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Validate token and fetch reference data
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('Missing reference token');
        setLoading(false);
        return;
      }
      
      try {
        // Check if token is valid
        const { data: tokenData, error: tokenError } = await supabase
          .from('reference_tokens')
          .select('reference_id, expires_at')
          .eq('token', token)
          .single();
        
        if (tokenError || !tokenData) {
          throw new Error('Invalid or expired reference token');
        }
        
        const tokenInfo = tokenData as ReferenceToken;
        
        // Check if token has expired
        if (new Date(tokenInfo.expires_at) < new Date()) {
          throw new Error('This reference request has expired');
        }
        
        // Fetch reference data
        const { data: referenceData, error: refError } = await supabase
          .from('references')
          .select(`
            id, 
            referee_name, 
            referee_email, 
            relationship, 
            company,
            status,
            user_id (
              id,
              profiles:users_profile (
                first_name,
                last_name
              )
            )
          `)
          .eq('id', tokenInfo.reference_id)
          .single();
        
        if (refError || !referenceData) {
          throw new Error('Could not find reference data');
        }
        
        // Check if reference is already completed
        if (referenceData.status === 'completed' || referenceData.status === 'declined') {
          throw new Error('This reference has already been submitted');
        }
        
        setReferenceData(referenceData);
        
        // Fetch reference questions
        const { data: questionData, error: qError } = await supabase
          .from('reference_questions')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });
        
        if (qError) {
          console.error('Error fetching questions:', qError);
        } else {
          setQuestions(questionData || []);
          
          // Initialize answers object
          const initialAnswers: Record<string, string> = {};
          questionData.forEach((q: ReferenceQuestion) => {
            initialAnswers[q.id] = '';
          });
          setAnswers(initialAnswers);
        }
        
      } catch (err) {
        console.error('Error validating token:', err);
        setError(err instanceof Error ? err.message : 'Failed to validate reference request');
      } finally {
        setLoading(false);
      }
    }
    
    validateToken();
  }, [token]);
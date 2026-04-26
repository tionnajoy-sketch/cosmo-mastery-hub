export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assessment_dna: {
        Row: {
          accuracy_score: number
          attempt_count: number
          confidence_signal: string | null
          created_at: string
          dominant_gap: string | null
          first_attempt_correct: boolean | null
          id: string
          last_answer_correct: boolean | null
          last_review_path: string | null
          mastery_status: string
          recommended_static_action: string | null
          reteach_trigger: boolean
          term_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number
          attempt_count?: number
          confidence_signal?: string | null
          created_at?: string
          dominant_gap?: string | null
          first_attempt_correct?: boolean | null
          id?: string
          last_answer_correct?: boolean | null
          last_review_path?: string | null
          mastery_status?: string
          recommended_static_action?: string | null
          reteach_trigger?: boolean
          term_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_score?: number
          attempt_count?: number
          confidence_signal?: string | null
          created_at?: string
          dominant_gap?: string | null
          first_attempt_correct?: boolean | null
          id?: string
          last_answer_correct?: boolean | null
          last_review_path?: string | null
          mastery_status?: string
          recommended_static_action?: string | null
          reteach_trigger?: boolean
          term_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          term_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          term_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          term_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          section_tag: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          id?: string
          section_tag?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          section_tag?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_replies: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      confidence_ratings: {
        Row: {
          block_number: number | null
          confidence_rating: number
          created_at: string
          id: string
          is_correct: boolean
          module_id: string | null
          question_ref: string
          question_text: string
          section_id: string | null
          surface: string
          term_id: string | null
          understanding_status: string
          user_id: string
        }
        Insert: {
          block_number?: number | null
          confidence_rating: number
          created_at?: string
          id?: string
          is_correct: boolean
          module_id?: string | null
          question_ref?: string
          question_text?: string
          section_id?: string | null
          surface: string
          term_id?: string | null
          understanding_status: string
          user_id: string
        }
        Update: {
          block_number?: number | null
          confidence_rating?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          module_id?: string | null
          question_ref?: string
          question_text?: string
          section_id?: string | null
          surface?: string
          term_id?: string | null
          understanding_status?: string
          user_id?: string
        }
        Relationships: []
      }
      cosmo_grid_sessions: {
        Row: {
          completed: boolean
          completed_words: Json
          created_at: string
          id: string
          level: number
          score: number
          session_date: string
          time_taken_seconds: number
          total_words: number
          user_id: string
          weak_categories: Json
          words_correct: number
        }
        Insert: {
          completed?: boolean
          completed_words?: Json
          created_at?: string
          id?: string
          level?: number
          score?: number
          session_date?: string
          time_taken_seconds?: number
          total_words?: number
          user_id: string
          weak_categories?: Json
          words_correct?: number
        }
        Update: {
          completed?: boolean
          completed_words?: Json
          created_at?: string
          id?: string
          level?: number
          score?: number
          session_date?: string
          time_taken_seconds?: number
          total_words?: number
          user_id?: string
          weak_categories?: Json
          words_correct?: number
        }
        Relationships: []
      }
      dna_milestones: {
        Row: {
          id: string
          metadata: Json
          milestone_key: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          metadata?: Json
          milestone_key: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          metadata?: Json
          milestone_key?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dna_progress_events: {
        Row: {
          created_at: string
          delta: number | null
          field: string
          from_value: string
          id: string
          lesson_context: Json
          note: string
          to_value: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta?: number | null
          field: string
          from_value?: string
          id?: string
          lesson_context?: Json
          note?: string
          to_value?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number | null
          field?: string
          from_value?: string
          id?: string
          lesson_context?: Json
          note?: string
          to_value?: string
          user_id?: string
        }
        Relationships: []
      }
      error_type_picks: {
        Row: {
          block_number: number | null
          created_at: string
          error_type: string
          id: string
          module_id: string | null
          question_ref: string
          routed_to: string
          term_id: string | null
          user_id: string
        }
        Insert: {
          block_number?: number | null
          created_at?: string
          error_type: string
          id?: string
          module_id?: string | null
          question_ref?: string
          routed_to?: string
          term_id?: string | null
          user_id: string
        }
        Update: {
          block_number?: number | null
          created_at?: string
          error_type?: string
          id?: string
          module_id?: string | null
          question_ref?: string
          routed_to?: string
          term_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      explain_it_back_responses: {
        Row: {
          block_number: number | null
          context_ref: string
          created_at: string
          explain_it_back_response: string
          follow_up_action: string | null
          id: string
          learning_behavior_flag: string | null
          module_id: string | null
          skipped: boolean
          term_id: string | null
          trigger_source: string
          user_id: string
          word_count: number
        }
        Insert: {
          block_number?: number | null
          context_ref?: string
          created_at?: string
          explain_it_back_response?: string
          follow_up_action?: string | null
          id?: string
          learning_behavior_flag?: string | null
          module_id?: string | null
          skipped?: boolean
          term_id?: string | null
          trigger_source?: string
          user_id: string
          word_count?: number
        }
        Update: {
          block_number?: number | null
          context_ref?: string
          created_at?: string
          explain_it_back_response?: string
          follow_up_action?: string | null
          id?: string
          learning_behavior_flag?: string | null
          module_id?: string | null
          skipped?: boolean
          term_id?: string | null
          trigger_source?: string
          user_id?: string
          word_count?: number
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          correctness: boolean | null
          created_at: string
          id: string
          prompt_question: string
          reflection_type: string
          term_id: string | null
          topic: string
          user_id: string
          user_response: string
        }
        Insert: {
          correctness?: boolean | null
          created_at?: string
          id?: string
          prompt_question?: string
          reflection_type?: string
          term_id?: string | null
          topic?: string
          user_id: string
          user_response?: string
        }
        Update: {
          correctness?: boolean | null
          created_at?: string
          id?: string
          prompt_question?: string
          reflection_type?: string
          term_id?: string | null
          topic?: string
          user_id?: string
          user_response?: string
        }
        Relationships: []
      }
      journal_notes: {
        Row: {
          id: string
          note: string
          term_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          note?: string
          term_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          note?: string
          term_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_notes_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_behavior_signals: {
        Row: {
          attempt_number: number
          breakdown_point: string | null
          cognitive_load: string
          confidence_rating: number | null
          created_at: string
          error_type: string
          explain_back_text: string
          explain_back_word_count: number
          id: string
          layer_completion_integrity: number
          micro_decisions: Json
          mode: string
          second_chance_improved: boolean
          second_chance_used: boolean
          stage_id: string
          term_id: string
          thinking_path: string | null
          time_on_stage_ms: number
          user_id: string
        }
        Insert: {
          attempt_number?: number
          breakdown_point?: string | null
          cognitive_load?: string
          confidence_rating?: number | null
          created_at?: string
          error_type?: string
          explain_back_text?: string
          explain_back_word_count?: number
          id?: string
          layer_completion_integrity?: number
          micro_decisions?: Json
          mode?: string
          second_chance_improved?: boolean
          second_chance_used?: boolean
          stage_id: string
          term_id: string
          thinking_path?: string | null
          time_on_stage_ms?: number
          user_id: string
        }
        Update: {
          attempt_number?: number
          breakdown_point?: string | null
          cognitive_load?: string
          confidence_rating?: number | null
          created_at?: string
          error_type?: string
          explain_back_text?: string
          explain_back_word_count?: number
          id?: string
          layer_completion_integrity?: number
          micro_decisions?: Json
          mode?: string
          second_chance_improved?: boolean
          second_chance_used?: boolean
          stage_id?: string
          term_id?: string
          thinking_path?: string | null
          time_on_stage_ms?: number
          user_id?: string
        }
        Relationships: []
      }
      learning_mode_events: {
        Row: {
          created_at: string
          duration_ms: number
          from_mode: string | null
          id: string
          module_id: string | null
          term_id: string | null
          to_mode: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number
          from_mode?: string | null
          id?: string
          module_id?: string | null
          term_id?: string | null
          to_mode: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          from_mode?: string | null
          id?: string
          module_id?: string | null
          term_id?: string | null
          to_mode?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_mode_stats: {
        Row: {
          created_at: string
          first_mode: string | null
          id: string
          last_mode: string | null
          mode_switch_count: number
          module_id: string | null
          preferred_mode: string | null
          teach_mode_time: number
          teach_open_count: number
          term_id: string | null
          test_mode_time: number
          test_open_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_mode?: string | null
          id?: string
          last_mode?: string | null
          mode_switch_count?: number
          module_id?: string | null
          preferred_mode?: string | null
          teach_mode_time?: number
          teach_open_count?: number
          term_id?: string | null
          test_mode_time?: number
          test_open_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_mode?: string | null
          id?: string
          last_mode?: string | null
          mode_switch_count?: number
          module_id?: string | null
          preferred_mode?: string | null
          teach_mode_time?: number
          teach_open_count?: number
          term_id?: string | null
          test_mode_time?: number
          test_open_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      micro_decision_events: {
        Row: {
          action: string
          block_number: number | null
          created_at: string
          id: string
          metadata: Json
          module_id: string | null
          surface: string
          term_id: string | null
          time_on_surface_ms: number | null
          user_id: string
        }
        Insert: {
          action: string
          block_number?: number | null
          created_at?: string
          id?: string
          metadata?: Json
          module_id?: string | null
          surface?: string
          term_id?: string | null
          time_on_surface_ms?: number | null
          user_id: string
        }
        Update: {
          action?: string
          block_number?: number | null
          created_at?: string
          id?: string
          metadata?: Json
          module_id?: string | null
          surface?: string
          term_id?: string | null
          time_on_surface_ms?: number | null
          user_id?: string
        }
        Relationships: []
      }
      micro_decision_flags: {
        Row: {
          created_at: string
          flag: string
          id: string
          last_triggered_at: string
          occurrence_count: number
          term_id: string | null
          triggered: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flag: string
          id?: string
          last_triggered_at?: string
          occurrence_count?: number
          term_id?: string | null
          triggered?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flag?: string
          id?: string
          last_triggered_at?: string
          occurrence_count?: number
          term_id?: string | null
          triggered?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_chapters: {
        Row: {
          chapter_number: number
          created_at: string
          id: string
          metadata: Json
          module_id: string
          page_range_end: number
          page_range_start: number
          parent_chapter_id: string | null
          summary: string
          title: string
        }
        Insert: {
          chapter_number?: number
          created_at?: string
          id?: string
          metadata?: Json
          module_id: string
          page_range_end?: number
          page_range_start?: number
          parent_chapter_id?: string | null
          summary?: string
          title?: string
        }
        Update: {
          chapter_number?: number
          created_at?: string
          id?: string
          metadata?: Json
          module_id?: string
          page_range_end?: number
          page_range_start?: number
          parent_chapter_id?: string | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_chapters_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "uploaded_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_chapters_parent_chapter_id_fkey"
            columns: ["parent_chapter_id"]
            isOneToOne: false
            referencedRelation: "module_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      module_document_overview: {
        Row: {
          chapter_outline: Json
          created_at: string
          document_title: string
          document_type: string
          id: string
          key_themes: Json
          module_id: string
          overview_summary: string
          subject: string
          total_chapters: number
        }
        Insert: {
          chapter_outline?: Json
          created_at?: string
          document_title?: string
          document_type?: string
          id?: string
          key_themes?: Json
          module_id: string
          overview_summary?: string
          subject?: string
          total_chapters?: number
        }
        Update: {
          chapter_outline?: Json
          created_at?: string
          document_title?: string
          document_type?: string
          id?: string
          key_themes?: Json
          module_id?: string
          overview_summary?: string
          subject?: string
          total_chapters?: number
        }
        Relationships: [
          {
            foreignKeyName: "module_document_overview_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: true
            referencedRelation: "uploaded_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      posttest_results: {
        Row: {
          completed_at: string
          id: string
          overall_score: number
          section_scores: Json
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          overall_score?: number
          section_scores?: Json
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          overall_score?: number
          section_scores?: Json
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posttest_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pretest_answers: {
        Row: {
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pretest_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pretest_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pretest_results: {
        Row: {
          completed_at: string
          id: string
          learning_style: string
          overall_score: number
          section_scores: Json
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          learning_style?: string
          overall_score?: number
          section_scores?: Json
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          learning_style?: string
          overall_score?: number
          section_scores?: Json
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pretest_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          behavior_history: Json
          birth_month: number | null
          birth_year: number | null
          brain_strengths: Json
          created_at: string
          dna_confidence: string | null
          dna_engagement: number | null
          dna_layer_strength: string | null
          dna_retention: string | null
          exam_date: string | null
          has_completed_onboarding: boolean | null
          has_completed_pretest: boolean
          id: string
          language: string
          layer_scores: Json
          leaderboard_preference: string | null
          learning_style: string
          name: string
          program: string | null
          selected_program: string | null
          sex: string | null
          state: string | null
          tj_dna_code: string | null
          tone_preference: string | null
        }
        Insert: {
          behavior_history?: Json
          birth_month?: number | null
          birth_year?: number | null
          brain_strengths?: Json
          created_at?: string
          dna_confidence?: string | null
          dna_engagement?: number | null
          dna_layer_strength?: string | null
          dna_retention?: string | null
          exam_date?: string | null
          has_completed_onboarding?: boolean | null
          has_completed_pretest?: boolean
          id: string
          language?: string
          layer_scores?: Json
          leaderboard_preference?: string | null
          learning_style?: string
          name?: string
          program?: string | null
          selected_program?: string | null
          sex?: string | null
          state?: string | null
          tj_dna_code?: string | null
          tone_preference?: string | null
        }
        Update: {
          behavior_history?: Json
          birth_month?: number | null
          birth_year?: number | null
          brain_strengths?: Json
          created_at?: string
          dna_confidence?: string | null
          dna_engagement?: number | null
          dna_layer_strength?: string | null
          dna_retention?: string | null
          exam_date?: string | null
          has_completed_onboarding?: boolean | null
          has_completed_pretest?: boolean
          id?: string
          language?: string
          layer_scores?: Json
          leaderboard_preference?: string | null
          learning_style?: string
          name?: string
          program?: string | null
          selected_program?: string | null
          sex?: string | null
          state?: string | null
          tj_dna_code?: string | null
          tone_preference?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          block_number: number
          correct_option: string
          explanation: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          related_term_id: string | null
          section_id: string
        }
        Insert: {
          block_number?: number
          correct_option?: string
          explanation?: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          related_term_id?: string | null
          section_id: string
        }
        Update: {
          block_number?: number
          correct_option?: string
          explanation?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          related_term_id?: string | null
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_related_term_id_fkey"
            columns: ["related_term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          block_number: number
          completed_at: string
          id: string
          score: number
          section_id: string
          total_questions: number
          user_id: string
        }
        Insert: {
          block_number?: number
          completed_at?: string
          id?: string
          score?: number
          section_id: string
          total_questions?: number
          user_id: string
        }
        Update: {
          block_number?: number
          completed_at?: string
          id?: string
          score?: number
          section_id?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recall_attempts: {
        Row: {
          created_at: string
          id: string
          mode: string
          reinforcement_passed: boolean | null
          response: string
          score_pct: number
          term_id: string
          triggered_reinforcement: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          reinforcement_passed?: boolean | null
          response?: string
          score_pct?: number
          term_id: string
          triggered_reinforcement?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          reinforcement_passed?: boolean | null
          response?: string
          score_pct?: number
          term_id?: string
          triggered_reinforcement?: boolean
          user_id?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          id: string
          response: string
          term_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          response?: string
          term_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          response?: string
          term_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      second_chance_picks: {
        Row: {
          block_number: number | null
          created_at: string
          error_type: string | null
          id: string
          module_id: string | null
          question_ref: string | null
          recovery_pattern: string | null
          retry_correct: boolean | null
          second_chance_behavior: string
          term_id: string | null
          user_id: string
        }
        Insert: {
          block_number?: number | null
          created_at?: string
          error_type?: string | null
          id?: string
          module_id?: string | null
          question_ref?: string | null
          recovery_pattern?: string | null
          retry_correct?: boolean | null
          second_chance_behavior: string
          term_id?: string | null
          user_id: string
        }
        Update: {
          block_number?: number | null
          created_at?: string
          error_type?: string | null
          id?: string
          module_id?: string | null
          question_ref?: string | null
          recovery_pattern?: string | null
          retry_correct?: boolean | null
          second_chance_behavior?: string
          term_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          color_theme: string
          description: string
          id: string
          name: string
          order: number
        }
        Insert: {
          color_theme?: string
          description?: string
          id?: string
          name: string
          order?: number
        }
        Update: {
          color_theme?: string
          description?: string
          id?: string
          name?: string
          order?: number
        }
        Relationships: []
      }
      student_contracts: {
        Row: {
          commitment_text: string
          goal_date: string | null
          id: string
          signed_at: string
          user_id: string
        }
        Insert: {
          commitment_text?: string
          goal_date?: string | null
          id?: string
          signed_at?: string
          user_id: string
        }
        Update: {
          commitment_text?: string
          goal_date?: string | null
          id?: string
          signed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_activity: {
        Row: {
          activities_completed: number
          activity_date: string
          created_at: string
          goal_met: boolean
          id: string
          questions_answered: number
          user_id: string
        }
        Insert: {
          activities_completed?: number
          activity_date?: string
          created_at?: string
          goal_met?: boolean
          id?: string
          questions_answered?: number
          user_id: string
        }
        Update: {
          activities_completed?: number
          activity_date?: string
          created_at?: string
          goal_met?: boolean
          id?: string
          questions_answered?: number
          user_id?: string
        }
        Relationships: []
      }
      term_entry_choices: {
        Row: {
          created_at: string
          id: string
          module_id: string | null
          preferred_thinking_path: string
          routed_to_step: string
          term_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id?: string | null
          preferred_thinking_path: string
          routed_to_step: string
          term_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string | null
          preferred_thinking_path?: string
          routed_to_step?: string
          term_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      term_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          term_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          term_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_images_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: true
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      term_learning_status: {
        Row: {
          created_at: string
          id: string
          last_reviewed_at: string
          status: string
          term_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reviewed_at?: string
          status?: string
          term_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reviewed_at?: string
          status?: string
          term_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_learning_status_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      term_struggle: {
        Row: {
          correct_attempts: number
          created_at: string
          id: string
          incorrect_attempts: number
          last_attempted: string
          mastery_status: string
          reinforcement_cycles: number
          term_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_attempts?: number
          created_at?: string
          id?: string
          incorrect_attempts?: number
          last_attempted?: string
          mastery_status?: string
          reinforcement_cycles?: number
          term_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_attempts?: number
          created_at?: string
          id?: string
          incorrect_attempts?: number
          last_attempted?: string
          mastery_status?: string
          reinforcement_cycles?: number
          term_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      terms: {
        Row: {
          affirmation: string
          apply_content: string
          assess_answer: string
          assess_explanation: string
          assess_question: string
          block_number: number
          break_it_down_content: string
          concept_identity: Json
          define_content: string
          definition: string
          id: string
          information_content: string
          lesson_narrative: Json
          metaphor: string
          metaphor_content: string
          order: number
          recognize_content: string
          reflect_content: string
          section_id: string
          term: string
          visualize_content: string
        }
        Insert: {
          affirmation?: string
          apply_content?: string
          assess_answer?: string
          assess_explanation?: string
          assess_question?: string
          block_number?: number
          break_it_down_content?: string
          concept_identity?: Json
          define_content?: string
          definition?: string
          id?: string
          information_content?: string
          lesson_narrative?: Json
          metaphor?: string
          metaphor_content?: string
          order?: number
          recognize_content?: string
          reflect_content?: string
          section_id: string
          term: string
          visualize_content?: string
        }
        Update: {
          affirmation?: string
          apply_content?: string
          assess_answer?: string
          assess_explanation?: string
          assess_question?: string
          block_number?: number
          break_it_down_content?: string
          concept_identity?: Json
          define_content?: string
          definition?: string
          id?: string
          information_content?: string
          lesson_narrative?: Json
          metaphor?: string
          metaphor_content?: string
          order?: number
          recognize_content?: string
          reflect_content?: string
          section_id?: string
          term?: string
          visualize_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      tj_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notes: string
          payload: Json
          rule_key: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string
          payload?: Json
          rule_key: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string
          payload?: Json
          rule_key?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tj_term_stages: {
        Row: {
          accuracy_score: number
          attempt_count: number
          completion_state: string
          created_at: string
          detected_stage: string | null
          id: string
          last_feedback: Json
          last_submission: string
          missing_layer: string | null
          recommended_next_action: string
          reinforcement_triggered: boolean
          stage_id: string
          term_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number
          attempt_count?: number
          completion_state?: string
          created_at?: string
          detected_stage?: string | null
          id?: string
          last_feedback?: Json
          last_submission?: string
          missing_layer?: string | null
          recommended_next_action?: string
          reinforcement_triggered?: boolean
          stage_id: string
          term_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_score?: number
          attempt_count?: number
          completion_state?: string
          created_at?: string
          detected_stage?: string | null
          id?: string
          last_feedback?: Json
          last_submission?: string
          missing_layer?: string | null
          recommended_next_action?: string
          reinforcement_triggered?: boolean
          stage_id?: string
          term_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tts_cache: {
        Row: {
          cache_hits: number
          created_at: string
          id: string
          is_always_cache: boolean
          last_accessed_at: string
          original_text: string
          storage_path: string
          text_hash: string
          text_preview: string
          usage_type: string
          voice_id: string
          voice_settings: Json
        }
        Insert: {
          cache_hits?: number
          created_at?: string
          id?: string
          is_always_cache?: boolean
          last_accessed_at?: string
          original_text?: string
          storage_path: string
          text_hash: string
          text_preview?: string
          usage_type?: string
          voice_id?: string
          voice_settings?: Json
        }
        Update: {
          cache_hits?: number
          created_at?: string
          id?: string
          is_always_cache?: boolean
          last_accessed_at?: string
          original_text?: string
          storage_path?: string
          text_hash?: string
          text_preview?: string
          usage_type?: string
          voice_id?: string
          voice_settings?: Json
        }
        Relationships: []
      }
      uploaded_module_blocks: {
        Row: {
          affirmation: string
          application_steps: Json
          block_number: number
          chapter_id: string | null
          chunk_index: number
          concept_identity: Json
          created_at: string
          definition: string
          difficulty_level: string
          explanation: string
          id: string
          image_url: string
          instructor_notes: string
          key_concepts: Json
          memory_anchors: Json
          metaphor: string
          module_id: string
          page_reference: string
          practice_scenario: string
          pronunciation: string
          quiz_answer: string
          quiz_answer_2: string
          quiz_answer_3: string
          quiz_options: Json
          quiz_options_2: Json
          quiz_options_3: Json
          quiz_question: string
          quiz_question_2: string
          quiz_question_3: string
          reflection_prompt: string
          search_tags: Json
          section_title: string
          slide_type: string
          source_text: string
          term_title: string
          themes: Json
          user_notes: string
          video_url: string
          visualization_desc: string
        }
        Insert: {
          affirmation?: string
          application_steps?: Json
          block_number?: number
          chapter_id?: string | null
          chunk_index?: number
          concept_identity?: Json
          created_at?: string
          definition?: string
          difficulty_level?: string
          explanation?: string
          id?: string
          image_url?: string
          instructor_notes?: string
          key_concepts?: Json
          memory_anchors?: Json
          metaphor?: string
          module_id: string
          page_reference?: string
          practice_scenario?: string
          pronunciation?: string
          quiz_answer?: string
          quiz_answer_2?: string
          quiz_answer_3?: string
          quiz_options?: Json
          quiz_options_2?: Json
          quiz_options_3?: Json
          quiz_question?: string
          quiz_question_2?: string
          quiz_question_3?: string
          reflection_prompt?: string
          search_tags?: Json
          section_title?: string
          slide_type?: string
          source_text?: string
          term_title?: string
          themes?: Json
          user_notes?: string
          video_url?: string
          visualization_desc?: string
        }
        Update: {
          affirmation?: string
          application_steps?: Json
          block_number?: number
          chapter_id?: string | null
          chunk_index?: number
          concept_identity?: Json
          created_at?: string
          definition?: string
          difficulty_level?: string
          explanation?: string
          id?: string
          image_url?: string
          instructor_notes?: string
          key_concepts?: Json
          memory_anchors?: Json
          metaphor?: string
          module_id?: string
          page_reference?: string
          practice_scenario?: string
          pronunciation?: string
          quiz_answer?: string
          quiz_answer_2?: string
          quiz_answer_3?: string
          quiz_options?: Json
          quiz_options_2?: Json
          quiz_options_3?: Json
          quiz_question?: string
          quiz_question_2?: string
          quiz_question_3?: string
          reflection_prompt?: string
          search_tags?: Json
          section_title?: string
          slide_type?: string
          source_text?: string
          term_title?: string
          themes?: Json
          user_notes?: string
          video_url?: string
          visualization_desc?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_module_blocks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "module_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_module_blocks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "uploaded_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_module_quiz_bank: {
        Row: {
          correct_option: string
          created_at: string
          explanation: string
          id: string
          module_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          source_slide: number | null
        }
        Insert: {
          correct_option?: string
          created_at?: string
          explanation?: string
          id?: string
          module_id: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          source_slide?: number | null
        }
        Update: {
          correct_option?: string
          created_at?: string
          explanation?: string
          id?: string
          module_id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          source_slide?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_module_quiz_bank_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "uploaded_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_modules: {
        Row: {
          created_at: string
          detected_subject: string
          document_type: string
          id: string
          is_instructor_mode: boolean
          processing_phase: string
          source_filename: string
          status: string
          title: string
          total_chapters: number
          user_id: string
        }
        Insert: {
          created_at?: string
          detected_subject?: string
          document_type?: string
          id?: string
          is_instructor_mode?: boolean
          processing_phase?: string
          source_filename?: string
          status?: string
          title?: string
          total_chapters?: number
          user_id: string
        }
        Update: {
          created_at?: string
          detected_subject?: string
          document_type?: string
          id?: string
          is_instructor_mode?: boolean
          processing_phase?: string
          source_filename?: string
          status?: string
          title?: string
          total_chapters?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_modules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_quiz_results: {
        Row: {
          block_number: number
          completed_at: string
          id: string
          mode: string
          module_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          block_number?: number
          completed_at?: string
          id?: string
          mode?: string
          module_id: string
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          block_number?: number
          completed_at?: string
          id?: string
          mode?: string
          module_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_quiz_results_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "uploaded_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coins: {
        Row: {
          blocks_mastered: number
          coins: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks_mastered?: number
          coins?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks_mastered?: number
          coins?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_metrics: {
        Row: {
          confidence: number
          created_at: string
          id: string
          last_interaction_at: string
          layers_completed: Json
          mastery_achieved: boolean
          retention: number
          term_id: string | null
          understanding: number
          user_id: string
          xp: number
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          last_interaction_at?: string
          layers_completed?: Json
          mastery_achieved?: boolean
          retention?: number
          term_id?: string | null
          understanding?: number
          user_id: string
          xp?: number
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          last_interaction_at?: string
          layers_completed?: Json
          mastery_achieved?: boolean
          retention?: number
          term_id?: string | null
          understanding?: number
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_metrics_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wrong_answers: {
        Row: {
          block_number: number
          created_at: string
          id: string
          question_id: string
          section_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          block_number?: number
          created_at?: string
          id?: string
          question_id: string
          section_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          block_number?: number
          created_at?: string
          id?: string
          question_id?: string
          section_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wrong_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wrong_answers_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wrong_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: never
        Returns: {
          blocks_mastered: number
          current_streak: number
          total_coins: number
          user_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "instructor" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "instructor", "student"],
    },
  },
} as const

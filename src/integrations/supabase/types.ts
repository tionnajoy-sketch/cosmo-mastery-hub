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
          created_at: string
          exam_date: string | null
          has_completed_pretest: boolean
          id: string
          language: string
          learning_style: string
          name: string
          program: string | null
          state: string | null
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          has_completed_pretest?: boolean
          id: string
          language?: string
          learning_style?: string
          name?: string
          program?: string | null
          state?: string | null
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          has_completed_pretest?: boolean
          id?: string
          language?: string
          learning_style?: string
          name?: string
          program?: string | null
          state?: string | null
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
      terms: {
        Row: {
          affirmation: string
          block_number: number
          definition: string
          id: string
          metaphor: string
          order: number
          section_id: string
          term: string
        }
        Insert: {
          affirmation?: string
          block_number?: number
          definition?: string
          id?: string
          metaphor?: string
          order?: number
          section_id: string
          term: string
        }
        Update: {
          affirmation?: string
          block_number?: number
          definition?: string
          id?: string
          metaphor?: string
          order?: number
          section_id?: string
          term?: string
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
      uploaded_module_blocks: {
        Row: {
          affirmation: string
          block_number: number
          created_at: string
          definition: string
          id: string
          metaphor: string
          module_id: string
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
          term_title: string
          user_notes: string
          visualization_desc: string
        }
        Insert: {
          affirmation?: string
          block_number?: number
          created_at?: string
          definition?: string
          id?: string
          metaphor?: string
          module_id: string
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
          term_title?: string
          user_notes?: string
          visualization_desc?: string
        }
        Update: {
          affirmation?: string
          block_number?: number
          created_at?: string
          definition?: string
          id?: string
          metaphor?: string
          module_id?: string
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
          term_title?: string
          user_notes?: string
          visualization_desc?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_module_blocks_module_id_fkey"
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
          id: string
          is_instructor_mode: boolean
          source_filename: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_instructor_mode?: boolean
          source_filename?: string
          status?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_instructor_mode?: boolean
          source_filename?: string
          status?: string
          title?: string
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

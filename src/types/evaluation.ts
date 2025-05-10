export interface EvaluationQuestion {
  id: string;
  description: string;
  evaluation_variables?: EvaluationVariable[];
  created_at: string;
}

export interface EvaluationVariable {
  id: string;
  question_id: string;
  variable_name: string;
  evaluation_suggested_answers?: EvaluationSuggestedAnswer[];
  created_at: string;
}

export interface EvaluationSuggestedAnswer {
  id: string;
  variable_id: string;
  answer_text: string;
  order_number: number;
  created_at: string;
}

export interface CreateEvaluationQuestionInput {
  description: string;
}

export interface CreateEvaluationVariableInput {
  question_id: string;
  variable_name: string;
}

export interface CreateEvaluationSuggestedAnswerInput {
  variable_id: string;
  answer_text: string;
  order_number: number;
} 
-- Create storage.buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    PRIMARY KEY (id)
);

-- Create storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    PRIMARY KEY (id),
    FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Insert the images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Give users authenticated access to folder 1" ON storage.objects
FOR ALL USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'question_set_images'
);

CREATE POLICY "Give public access to images bucket" ON storage.objects
FOR SELECT USING (
    bucket_id = 'images'
); 
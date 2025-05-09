# gem install rqrcode
# gem install prawn

require 'csv'
require 'rqrcode'
require 'prawn'
require 'fileutils'
require 'honey_format'

def remove_quotes_from_first_line(filepath)
  unless File.exist?(filepath)
    puts "Error: File not found at #{filepath}"
    return
  end

  begin
    lines = File.readlines(filepath)

    if lines.empty?
      puts "File is empty, nothing to do."
      return
    end

    # Remove all ' characters from the first line
    # The `chomp` is to remove the newline character before gsub,
    # then we add it back if it was there.
    # Or, more simply, just gsub on the line as is if you don't mind potentially
    # re-adding a newline if the first line was the *only* line and had no newline.
    # A safer bet is to chomp, modify, and then ensure the line ends with a newline
    # if it's not the last line or if the original had one.

    # Alt 1
    # first_line_original_ending = lines[0][-1] == "\n" ? "\n" : ""
    # lines[0] = lines[0].chomp.gsub("'", "")
    # lines[0] += first_line_original_ending unless lines[0].empty? && first_line_original_ending == "\n" # Avoid adding \n to an empty line unless it was truly just "\n"

    # Alt 2 - A simpler alternative for gsub that works directly on the line string:
    lines[0].gsub!("'", "") # In-place modification of the string in the array

    File.open(filepath, 'w') do |file|
      lines.each do |line|
        file.write(line) # .write will preserve newlines if they are already in the string
      end
    end

    puts "Successfully removed single quotes from the first line of #{filepath}"

  rescue StandardError => e
    puts "An error occurred: #{e.message}"
    exit(1)
  end
end

def truncate(text, length)
  omission = "..."
  return text if text.length <= length
  text[0, length - omission.length] + omission
end

# Get exported CSV file path from command line argument
csv_file_path = ARGV[0]
if csv_file_path.nil?
  puts "Please provide a path to the exported 'Community' CSV-file from WasHere."
  exit(1)
end

if !File.exist?(csv_file_path)
  puts "File not found: #{csv_file_path}"
  exit(1)
end

# Remove single quotes from the first line of the CSV file
# This is necessary to avoid issues with CSV parsing
remove_quotes_from_first_line(csv_file_path)

# --- Configuration ---
CSV_FILE_PATH = csv_file_path
OUTPUT_PDF_PATH = 'tmp/runner_qrcodes.pdf'
QR_CODE_LINK_PREFIX = 'https://links.washere.io/?memberNo='
TEMP_QR_IMAGE_DIR = 'tmp/qrs' # Directory for temporary QR images

# Create temporary directory if it doesn't exist
FileUtils.mkdir_p(TEMP_QR_IMAGE_DIR)

# Remove existing PDF if it exists
File.delete(OUTPUT_PDF_PATH) if File.exist?(OUTPUT_PDF_PATH)

Prawn::Document.generate(OUTPUT_PDF_PATH, page_size: 'A4', margin: [25, 25, 25, 25]) do |pdf|
  # Define some basic styling or layout parameters
  qr_code_size = 150 # points (Prawn uses PDF points)
  text_font_size = 8
  space_after_qr = 1
  space_after_text = 5
  items_per_row = 3 # Example: 3 QRs per row
  current_item_in_row = 0
  initial_y_position = pdf.cursor

  # Read the CSV file
  csv_options = {
    headers:            true,       # keep the header separate from data rows
    return_headers:     false,
    skip_blanks:        true,
    liberal_parsing:    true,       # <‑‑ accepts odd quoting situations
    encoding:           "UTF-8",    # BOM‑safe
    # col_sep: ","                  # uncomment if your separator is not a comma
  }
  rows = []
  CSV.foreach(CSV_FILE_PATH, **csv_options) do |row|
    rows.push({ email: row['Email'].downcase, member_no: row['Member No'] })
  end

  rows.sort { |a, b| a[:email] <=> b[:email] }.each do |row|
    email = row[:email]
    member_no = row[:member_no]

    # 1. Construct QR Code data
    qr_data = "#{QR_CODE_LINK_PREFIX}#{member_no}"
    alt_text = "#{truncate(email, 25)}, #{member_no}"

    # 2. Generate QR Code image
    qrcode_obj = RQRCode::QRCode.new(qr_data)
    qr_png_path = File.join(TEMP_QR_IMAGE_DIR, "qr_#{member_no.gsub(/[^a-zA-Z0-9_-]/, '')}.png") # Sanitize filename
    png = qrcode_obj.as_png(
      bit_depth: 1,
      border_modules: 4,
      color_mode: ChunkyPNG::COLOR_GRAYSCALE,
      color: 'black',
      file: nil, # Save to file below
      fill: 'white',
      module_px_size: 6,
      resize_exactly_to: false,
      resize_gte_to: false,
      size: 240 # pixels for the PNG image itself
    )
    IO.binwrite(qr_png_path, png.to_s)

    # --- Add to PDF ---
    # Basic layout: move to next row or page if needed
    if current_item_in_row == items_per_row
      pdf.move_down space_after_text * 2 # Extra space for new row
      initial_y_position = pdf.cursor
      current_item_in_row = 0
    end

    # Check if there's enough space on the page for QR + text + spacing
    # This is a simplified check; more robust pagination might be needed for many items
    required_height = qr_code_size + space_after_qr + text_font_size + space_after_text
    if pdf.cursor < required_height
        pdf.start_new_page
        initial_y_position = pdf.cursor
        current_item_in_row = 0 # Reset for new page
    end

    # Calculate x position for current item in row
    column_width = (pdf.bounds.width / items_per_row)
    x_position = current_item_in_row * column_width

    # Keep track of current y for this item
    current_y = pdf.cursor

    # 3. Add QR Code image to PDF (at x_position from left margin, current_y)
    begin
      pdf.bounding_box([x_position, current_y], width: column_width, height: qr_code_size + space_after_qr + text_font_size + 2) do
        pdf.image qr_png_path, width: qr_code_size, height: qr_code_size, position: :center
        pdf.move_down space_after_qr
        pdf.text alt_text, size: text_font_size, align: :center
      end
    rescue Prawn::Errors::UnsupportedImageType
      puts "Error: Could not embed image #{qr_png_path}. Ensure it's a valid PNG."
      next
    end

    current_item_in_row += 1

    # If this is not the last item in the row, move the cursor to the same Y for the next item
    if current_item_in_row < items_per_row && current_item_in_row != 0
      pdf.move_cursor_to current_y
    else # End of a row or last item
      pdf.move_cursor_to current_y - required_height # Move down past the item block
      pdf.move_down space_after_text
    end

    puts "Processed: #{email}, #{member_no}"
  end

  puts "PDF generated successfully: #{OUTPUT_PDF_PATH}"
end

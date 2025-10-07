require 'csv'
require 'time' # For Time.parse and time arithmetic

# --- Configuration ---
# Update this to the name of your input CSV file.
# If the script is not in the same directory as the CSV, provide the full path.
INPUT_CSV_FILE = 'tmp/altorp___scan_journey_events___list_2025-05-12T07_46_04.224723Z.csv'

# The output file will have '_processed' appended to the input file name.
OUTPUT_CSV_FILE = INPUT_CSV_FILE.sub(/\.csv$/i, '_processed.csv')

# Race start time as specified by the user.
RACE_START_TIME_UTC_STR = '08:00:00Z' # ISO 8601 format for 08:00 UTC

# Adjust this value to the correct distance of a single lap in kilometers.
LAP_DISTANCE_KM = 7.0

# Adjust this to the EXACT (case-sensitive) name of the timestamp column in your CSV.
TIMESTAMP_COLUMN_HEADER = 'triggeredAt' # Common examples: 'Timestamp', 'event_time', 'RecordedAt'
                                      # Check your CSV file's header row.

# --- Helper Function: Format duration to MM:SS.ss ---
# Takes seconds (float or integer) and returns a string like "01:35.50".
def format_duration_mm_ss_ff(seconds)
  # Handle nil or non-numeric inputs gracefully
  return "00:00.00" if seconds.nil? || !seconds.is_a?(Numeric)

  total_seconds_float = seconds.to_f
  # Determine sign for negative durations (e.g., if a timestamp is before race start)
  sign = total_seconds_float < 0 ? "-" : ""
  total_seconds_float = total_seconds_float.abs # Work with positive value for calculation

  minutes = (total_seconds_float / 60).to_i
  remaining_seconds = total_seconds_float % 60

  # Format: sign, minutes (2 digits, zero-padded), seconds (2 digits.2 decimal places, zero-padded)
  format("%s%02d:%05.2f", sign, minutes, remaining_seconds)
end

# --- Main Script Logic ---
begin
  # Check if the input file exists
  unless File.exist?(INPUT_CSV_FILE)
    puts "Error: Input CSV file '#{INPUT_CSV_FILE}' not found."
    puts "Please ensure the file name and path are correct in the script."
    exit
  end

  # Parse the overall race start time (UTC)
  begin
    race_start_time = Time.parse(RACE_START_TIME_UTC_STR)
  rescue ArgumentError => e
    puts "Error: Could not parse RACE_START_TIME_UTC_STR ('#{RACE_START_TIME_UTC_STR}'). Ensure it's a valid ISO 8601 time string. Details: #{e.message}"
    exit
  end

  # Initialize 'previous_lap_end_time' with the race start time.
  # This will be used to calculate the duration of the first lap.
  previous_lap_end_time = race_start_time

  output_rows = [] # To store all rows that will be written to the output CSV
  input_headers_with_new = nil # Will store all headers for the output file (original + new)
  
  processed_data_rows_count = 0 # Counter for successfully processed data rows
  first_data_row = true # Flag to handle header initialization and checks

  # Read the input CSV file row by row
  # headers: true - treats the first line as headers
  # skip_blanks: true - ignores any blank lines in the CSV
  CSV.foreach(INPUT_CSV_FILE, headers: true, skip_blanks: true) do |row|
    # 'row' is a CSV::Row object, which is hash-like (row['HeaderName'])

    if first_data_row
      # Check if the crucial timestamp header exists in the read CSV headers
      unless row.headers.include?(TIMESTAMP_COLUMN_HEADER)
        puts "Error: Timestamp column '#{TIMESTAMP_COLUMN_HEADER}' not found in the CSV."
        puts "Available headers are: #{row.headers.join(', ')}"
        puts "Please update the TIMESTAMP_COLUMN_HEADER variable in the script to match your CSV."
        exit # Critical error, cannot proceed
      end
      # Prepare the full list of headers for the output file
      input_headers_with_new = row.headers + ["Lap Time (seconds)", "Lap Time (MM:SS)", "Pace (min/km)"]
      first_data_row = false # Headers are now set up
    end

    # Get the timestamp string from the current row using the specified header name
    current_lap_timestamp_str = row[TIMESTAMP_COLUMN_HEADER]

    # Validate the timestamp string
    if current_lap_timestamp_str.nil? || current_lap_timestamp_str.strip.empty?
      puts "Warning: Row #{$.} (data row #{processed_data_rows_count + 1}) has a missing or empty timestamp in column '#{TIMESTAMP_COLUMN_HEADER}'. Skipping this row."
      # If you want to include rows with missing timestamps but blank calculated values:
      # output_rows << row.fields + [nil, nil, nil]
      next # Skip to the next row
    end

    # Parse the current lap's completion timestamp
    begin
      current_lap_end_time = Time.parse(current_lap_timestamp_str)
    rescue ArgumentError => e
      puts "Warning: Row #{$.} (data row #{processed_data_rows_count + 1}): Could not parse timestamp '#{current_lap_timestamp_str}'. Error: #{e.message}. Skipping this row."
      # If you want to include rows with unparseable timestamps but blank calculated values:
      # output_rows << row.fields + [nil, nil, nil]
      next # Skip to the next row
    end

    # Calculate lap duration in seconds
    # This is (current lap's end time) - (previous lap's end time, or race start for 1st lap)
    lap_duration_seconds = current_lap_end_time - previous_lap_end_time

    # Warning for negative lap times (e.g. data out of order, or first lap timestamp before race start)
    if lap_duration_seconds < 0
      warning_context = processed_data_rows_count == 0 ? "first lap's end time ('#{current_lap_timestamp_str}') is before race start ('#{RACE_START_TIME_UTC_STR}')" : "current timestamp ('#{current_lap_timestamp_str}') is before previous lap's end time ('#{previous_lap_end_time.iso8601(3)}')"
      puts "Warning: Row #{$.} (data row #{processed_data_rows_count + 1}): Calculated lap duration is negative (#{lap_duration_seconds.round(2)}s). This might indicate #{warning_context}."
    end
    
    # Calculate pace (minutes per kilometer)
    pace_min_per_km_output = "N/A" # Default if pace cannot be calculated
    if LAP_DISTANCE_KM <= 0
      # This warning will appear for each row if LAP_DISTANCE_KM is invalid.
      # Consider a flag to show it only once if preferred.
      puts "Warning: LAP_DISTANCE_KM is not positive (#{LAP_DISTANCE_KM} km). Pace cannot be calculated." if processed_data_rows_count == 0
    else
      lap_duration_minutes = lap_duration_seconds / 60.0
      pace_value = lap_duration_minutes / LAP_DISTANCE_KM
      if pace_value.is_a?(Numeric) && pace_value.finite?
          pace_min_per_km_output = pace_value.round(2)
      else
          pace_min_per_km_output = "Error" # Should not happen with valid numeric inputs
      end
    end

    # Add all original fields from the row, then the new calculated fields
    output_rows << row.fields + [
      lap_duration_seconds.round(2),          # Lap Time in seconds (e.g., 95.53)
      format_duration_mm_ss_ff(lap_duration_seconds), # Lap Time formatted (e.g., "01:35.53")
      pace_min_per_km_output                  # Pace (e.g., 3.75 or "N/A")
    ]

    # Update 'previous_lap_end_time' for the next iteration
    previous_lap_end_time = current_lap_end_time
    processed_data_rows_count += 1
  end # End of CSV.foreach loop

  # After processing all rows, write to the output CSV file
  if input_headers_with_new.nil?
    # This block executes if the input CSV was empty or contained only a header row
    # (and thus the CSV.foreach loop didn't run, or `first_data_row` logic wasn't triggered)
    puts "Warning: Input CSV '#{INPUT_CSV_FILE}' appears to be empty or contains only a header row."
    # Attempt to read just the header line to construct output headers
    header_line_text = nil
    begin
      File.open(INPUT_CSV_FILE, 'r') { |f| header_line_text = f.readline }
    rescue EOFError # File is completely empty
        # No action needed, header_line_text remains nil
    end

    if header_line_text
      original_headers = CSV.parse_line(header_line_text.chomp)
      # Check for timestamp column again if we just read headers
      unless original_headers.include?(TIMESTAMP_COLUMN_HEADER)
          puts "Error: Timestamp column '#{TIMESTAMP_COLUMN_HEADER}' not found in the CSV header."
          puts "Available headers are: #{original_headers.join(', ')}"
          puts "Cannot create output file header without the timestamp column defined correctly."
          exit
      end
      input_headers_with_new = original_headers + ["Lap Time (seconds)", "Lap Time (MM:SS)", "Pace (min/km)"]
    else # File is truly empty or header unreadable
      puts "Could not read headers from empty or malformed CSV. Using generic fallback headers for output."
      # Fallback headers if original headers couldn't be determined
      input_headers_with_new = ["Original_Col1_UNKNOWN", TIMESTAMP_COLUMN_HEADER, "Original_Col2_UNKNOWN", "Lap Time (seconds)", "Lap Time (MM:SS)", "Pace (min/km)"]
    end
  end

  # Write the collected data (headers + processed rows) to the output CSV file
  CSV.open(OUTPUT_CSV_FILE, 'wb') do |csv_out|
    csv_out << input_headers_with_new # Write the header row
    output_rows.each do |data_row|
      csv_out << data_row # Write each processed data row
    end
  end

  puts "\nProcessing complete."
  if processed_data_rows_count > 0
    puts "#{processed_data_rows_count} data rows processed."
  elsif !first_data_row # Headers were processed, but no data rows
    puts "The input CSV file contained a header, but no data rows were processed (or all were skipped)."
  else # No headers and no data rows processed (e.g. empty file)
    puts "No data was processed from the input file."
  end
  puts "Output written to '#{OUTPUT_CSV_FILE}'"

rescue CSV::MalformedCSVError => e
  # This catches errors related to the CSV format itself
  puts "Error: Malformed CSV data in '#{INPUT_CSV_FILE}' near line #{e.line_number}. Details: #{e.message}"
  puts "Please check the CSV file for formatting issues."
rescue StandardError => e
  # Catch any other unexpected errors during script execution
  puts "An unexpected error occurred: #{e.message}"
  puts "Backtrace:"
  e.backtrace.each { |line| puts "  #{line}" }
end

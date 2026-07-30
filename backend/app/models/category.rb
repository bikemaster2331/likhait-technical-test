class Category < ApplicationRecord
  has_many :expenses, dependent: :destroy

  # These are common English profanity and adult-content words we do not allow
  # in category names. This is a simple guardrail, not full content moderation.
  PROHIBITED_WORDS = %w[
    adult porn porno xxx nude nudes sex sexy fetish escort onlyfans
    fuck shit bitch asshole bastard damn
  ].freeze

  # This removes extra spaces before the other rules check the category name.
  before_validation :normalize_name

  validates :name,
            presence: true,
            uniqueness: { case_sensitive: false },
            length: { maximum: 100 }
  validate :name_does_not_contain_prohibited_words

  private

  def normalize_name
    self.name = name.strip if name
  end

  def name_does_not_contain_prohibited_words
    return if name.blank?

    words_in_name = name.downcase.scan(/[a-z]+/)
    return if (words_in_name & PROHIBITED_WORDS).empty?

    errors.add(:name, "contains inappropriate language")
  end
end

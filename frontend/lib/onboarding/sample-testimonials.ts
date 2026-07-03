// PLACEHOLDER TESTIMONIAL — replace with verified user feedback before production launch

export type SampleTestimonial = {
  type: "sample"
  role: "Student" | "Tutor"
  context: string
  quote: string
}

export const sampleTestimonials: SampleTestimonial[] = [
  {
    type: "sample",
    role: "Student",
    context: "Finding an IELTS tutor",
    quote:
      "The filters made it easier to compare tutors who matched my budget and target score.",
  },
  {
    type: "sample",
    role: "Student",
    context: "Comparing tutor profiles",
    quote:
      "I could immediately compare tutors by price and teaching style instead of opening dozens of random profiles.",
  },
  {
    type: "sample",
    role: "Tutor",
    context: "Creating a tutor profile",
    quote:
      "The step-by-step profile builder made it clear what information students would see.",
  },
  {
    type: "sample",
    role: "Tutor",
    context: "Building trust on a profile",
    quote:
      "The tutor's profile felt clear and personal, so I understood their teaching style before contacting them.",
  },
]

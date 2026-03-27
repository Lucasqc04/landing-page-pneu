function Container({ className = '', children }) {
  return (
    <div className={`mx-auto w-full max-w-[1240px] px-6 md:px-10 lg:px-16 ${className}`}>
      {children}
    </div>
  )
}

export default Container

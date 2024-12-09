;; token-management contract

(define-fungible-token project-token)

(define-map token-supplies
  { project-id: uint }
  { supply: uint }
)

(define-constant contract-owner tx-sender)

(define-constant ERR-UNAUTHORIZED u401)
(define-constant ERR-INVALID-PROJECT u402)
(define-constant ERR-INSUFFICIENT-BALANCE u403)

(define-public (create-project-token (project-id uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err ERR-UNAUTHORIZED))
    (asserts! (is-none (map-get? token-supplies { project-id: project-id })) (err ERR-INVALID-PROJECT))
    (map-set token-supplies
      { project-id: project-id }
      { supply: u0 }
    )
    (ok true)
  )
)

(define-public (mint-tokens (project-id uint) (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err ERR-UNAUTHORIZED))
    (match (map-get? token-supplies { project-id: project-id })
      supply-data (let
        (
          (new-supply (+ (get supply supply-data) amount))
        )
        (map-set token-supplies
          { project-id: project-id }
          { supply: new-supply }
        )
        (ft-mint? project-token amount recipient)
      )
      (err ERR-INVALID-PROJECT)
    )
  )
)

(define-public (transfer-tokens (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-UNAUTHORIZED))
    (ft-transfer? project-token amount sender recipient)
  )
)

(define-read-only (get-token-balance (owner principal))
  (ok (ft-get-balance project-token owner))
)

(define-read-only (get-token-supply (project-id uint))
  (match (map-get? token-supplies { project-id: project-id })
    supply-data (ok (get supply supply-data))
    (err ERR-INVALID-PROJECT)
  )
)

